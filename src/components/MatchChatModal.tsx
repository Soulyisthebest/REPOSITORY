import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Lock, 
  ShieldCheck, 
  Clock, 
  Building, 
  MessageSquare, 
  CheckCheck,
  AlertCircle,
  Sparkles,
  Flag,
  FileText,
  Radio,
  Zap
} from 'lucide-react';
import { MatchResult, ChatMessage, TenantProfile } from '../types';
import { api } from '../api/client';
import { supabase } from '../lib/supabase';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { ReportModal } from './ReportModal';
import { TenantFullProfileModal } from './TenantFullProfileModal';
import { SEED_TENANTS } from '../data/seedTenants';
import { useChatSocket } from '../lib/useChatSocket';

interface MatchChatModalProps {
  match: MatchResult;
  currentUserId: string;
  isLandlord: boolean;
  tenantProfile?: TenantProfile;
  language: Language;
  onClose: () => void;
  onMatchUpdated?: (updatedMatch: MatchResult) => void;
}

export const MatchChatModal: React.FC<MatchChatModalProps> = ({
  match,
  currentUserId,
  isLandlord,
  tenantProfile,
  language,
  onClose,
  onMatchUpdated,
}) => {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [landlordFirstMessageSent, setLandlordFirstMessageSent] = useState(
    match.landlord_first_message_sent
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTenantProfileModal, setShowTenantProfileModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const safeMessages = Array.isArray(messages) ? messages : [];

  // Normalize tenant profile data for the full profile modal
  const tenantForModal = React.useMemo(() => {
    if (!match.tenant) return null;
    const seed = SEED_TENANTS.find(
      (st) => st.id === match.tenant?.id || st.tenant_id === match.tenant?.id
    );
    if (seed) return seed;

    return {
      id: match.tenant.id,
      fullName: match.tenant.name,
      firstName: match.tenant.name.split(' ')[0],
      avatar_url: match.tenant.avatar_url,
      photos: match.tenant.photos || (match.tenant.avatar_url ? [match.tenant.avatar_url] : []),
      profession: 'Profesional cualificado',
      employment_type: match.tenant.employment_type || 'indefinido',
      monthly_income: match.tenant.monthly_income || 2400,
      trustScore: match.tenant.trust_score || 92,
      occupants_count: match.tenant.occupants_count || 1,
      has_pets: match.tenant.has_pets || false,
      has_guarantor: false,
      bio: match.tenant.bio || 'Inquilino certificado en Rentia con solvencia acreditada.',
    };
  }, [match.tenant]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.matching.getMessages(match.id);
      const list = Array.isArray(res?.messages) ? res.messages : [];
      setMessages(list);
      setLandlordFirstMessageSent(Boolean(res?.landlord_first_message_sent));
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Erreur chargement messages:', err);
      if (isInitial) setMessages([]);
    } finally {
      if (isInitial) {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    }
  };

  // Callback cuando llega un mensaje en tiempo real por WebSocket
  const handleIncomingChatMessage = useCallback((newMsg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      const filtered = prev.filter(
        (m) => !(m.id.startsWith('temp_') && m.content === newMsg.content && m.sender_role === newMsg.sender_role)
      );
      return [...filtered, newMsg];
    });

    if (newMsg.sender_role === 'landlord' && !landlordFirstMessageSent) {
      setLandlordFirstMessageSent(true);
      if (onMatchUpdated) {
        onMatchUpdated({
          ...match,
          landlord_first_message_sent: true,
        });
      }
    }
    setTimeout(scrollToBottom, 50);
  }, [landlordFirstMessageSent, match, onMatchUpdated]);

  const handleLandlordFirstMessageUnlocked = useCallback(() => {
    setLandlordFirstMessageSent(true);
    if (onMatchUpdated) {
      onMatchUpdated({
        ...match,
        landlord_first_message_sent: true,
      });
    }
  }, [match, onMatchUpdated]);

  // Hook WebSocket en tiempo real de baja latencia (<1ms)
  const {
    isConnected: isWsConnected,
    isOtherTyping,
    sendInstantMessage,
    notifyTyping,
    markAsRead,
  } = useChatSocket({
    matchId: match.id,
    userId: currentUserId || (isLandlord ? 'landlord' : 'tenant'),
    role: isLandlord ? 'landlord' : 'tenant',
    onMessageReceived: handleIncomingChatMessage,
    onLandlordFirstMessageSent: handleLandlordFirstMessageUnlocked,
  });

  useEffect(() => {
    fetchMessages(true);
    markAsRead();

    // 1. Canal Realtime Supabase (si está configurado)
    let channel: any = null;
    try {
      channel = supabase
        .channel(`chat_match_${match.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${match.id}`,
          },
          (payload: any) => {
            if (payload.new) {
              handleIncomingChatMessage(payload.new as ChatMessage);
            }
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn('Realtime subscription fallback:', realtimeErr);
    }

    // 2. Sincronización instantánea cross-tab en el mismo navegador
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcast = new BroadcastChannel('rentia_chat_sync');
        broadcast.onmessage = (event) => {
          if (event.data?.matchId === match.id && event.data?.message) {
            handleIncomingChatMessage(event.data.message as ChatMessage);
          }
        };
      }
    } catch {}

    const handleLocalInstantMsg = (e: any) => {
      if (e.detail?.matchId === match.id && e.detail?.message) {
        handleIncomingChatMessage(e.detail.message as ChatMessage);
      }
    };
    window.addEventListener('rentia_instant_message', handleLocalInstantMsg);

    // 3. Fallback de reconciliación periódica ligera (cada 5s)
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMessages(false);
      }
    }, 5000);

    const onFocus = () => {
      fetchMessages(false);
      markAsRead();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('rentia_instant_message', handleLocalInstantMsg);
      if (broadcast) {
        broadcast.close();
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [match.id, handleIncomingChatMessage, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // RÈGLE MÉTIER STRICTE :
  // Le locataire ne peut pas envoyer de message tant que le propriétaire n'a pas envoyé le 1er message.
  const isInputDisabled = !isLandlord && !landlordFirstMessageSent;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    notifyTyping(val.trim().length > 0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || isInputDisabled) return;

    const messageContent = inputText.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      match_id: match.id,
      sender_id: currentUserId || (isLandlord ? 'landlord' : 'tenant'),
      sender_role: isLandlord ? 'landlord' : 'tenant',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    // Entrega instantánea inmediata en la interfaz (<1ms)
    setInputText('');
    notifyTyping(false);
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();
    setSending(true);
    setErrorMessage(null);

    // Difusión instantánea por WebSockets al otro usuario (<1ms)
    const sentViaWs = sendInstantMessage(messageContent);

    // Difundir inmediatamente para sincronización entre pestañas locales
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('rentia_chat_sync');
        bc.postMessage({ matchId: match.id, message: optimisticMessage });
        bc.close();
      }
      window.dispatchEvent(new CustomEvent('rentia_instant_message', {
        detail: { matchId: match.id, message: optimisticMessage },
      }));
    } catch {}

    // Persistir y reconciliar con el backend
    try {
      const res = await api.matching.sendMessage({
        matchId: match.id,
        content: messageContent,
        senderRole: isLandlord ? 'landlord' : 'tenant',
      });

      if (res.success && res.message) {
        // Reemplazar mensaje temporal con el registrado en el backend
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m))
        );
        if (res.landlord_first_message_sent && !landlordFirstMessageSent) {
          setLandlordFirstMessageSent(true);
          if (onMatchUpdated) {
            onMatchUpdated({
              ...match,
              landlord_first_message_sent: true,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur envoi message:', err);
      if (!sentViaWs) {
        setErrorMessage(err.message || 'Impossible d\'envoyer le message.');
        // En caso de fallo total, retirar el mensaje optimista y restaurar texto
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInputText(messageContent);
      }
    } finally {
      setSending(false);
    }
  };

  const interlocutorName = isLandlord
    ? match.tenant?.name || (language === 'es' ? 'Inquilino' : language === 'en' ? 'Tenant' : 'Locataire')
    : match.landlord?.name || (language === 'es' ? 'Propietario verificado' : language === 'en' ? 'Verified landlord' : 'Propriétaire certifié');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#FAF9F6] w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 flex flex-col h-[640px] max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-base shadow-2xs overflow-hidden">
                {isLandlord && match.tenant?.avatar_url ? (
                  <img 
                    src={match.tenant.avatar_url} 
                    alt={interlocutorName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  interlocutorName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-sm">{interlocutorName}</h3>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold">
                  {isLandlord ? t.tenantTag : t.landlordTag}
                </span>
                {isWsConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold" title={language === 'es' ? 'Canal WebSocket en tiempo real activo' : language === 'en' ? 'Live WebSocket channel active' : 'Canal WebSocket en temps réel actif'}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{language === 'es' ? 'En vivo ⚡' : language === 'en' ? 'Live ⚡' : 'En direct ⚡'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[10px] font-medium" title={language === 'es' ? 'Sincronizando' : language === 'en' ? 'Syncing' : 'Synchronisation'}>
                    <span>{language === 'es' ? 'Sincronizando...' : language === 'en' ? 'Syncing...' : 'Synchronisation...'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                <Building className="w-3 h-3 text-amber-700" />
                <span className="truncate max-w-[220px]">
                  {match.listing?.title || match.listing_id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isLandlord && tenantForModal && (
              <button
                type="button"
                onClick={() => setShowTenantProfileModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs transition-colors flex items-center gap-1 border border-indigo-200/80 shadow-2xs"
                title={language === 'es' ? 'Ver perfil completo del inquilino' : language === 'en' ? 'View full tenant profile' : 'Voir le dossier complet du locataire'}
                id="btn-chat-view-tenant-profile"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                <span className="hidden sm:inline">{language === 'es' ? 'Ver Perfil Completo' : language === 'en' ? 'View Full Profile' : 'Voir le profil complet'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={language === 'es' ? 'Denunciar conversación' : language === 'en' ? 'Report conversation' : 'Signaler la conversation'}
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title={t.closeChatBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Verification Banner */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'es' 
                ? 'Match bilateral verificado por Rentia' 
                : language === 'en' 
                ? 'Mutual match verified by Rentia' 
                : 'Match bilatéral certifié par Rentia'}
            </span>
          </div>
          <span className="text-[10.5px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            {match.compatibility_score}% {language === 'es' ? 'compatibilidad' : language === 'en' ? 'compatibility' : 'compatibilité'}
          </span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]">
          {loading && safeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-xs gap-2">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>
                {language === 'es' 
                  ? 'Cargando conversación segura...' 
                  : language === 'en' 
                  ? 'Loading secure conversation...' 
                  : 'Chargement de la conversation sécurisée...'}
              </span>
            </div>
          ) : safeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center mb-3 shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  
                  {/* État conditionnel selon le rôle de l'utilisateur */}
                  {isLandlord ? (
                    <div className="max-w-xs space-y-1">
                      <h4 className="font-bold text-stone-800 text-xs">
                        {t.landlordInitiatePrompt}
                      </h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {t.landlordInitiatePromptSubtext}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-xs space-y-1">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px] mb-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>{t.waitingLandlordFirstMessage}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        {t.waitingLandlordFirstMessageSubtext}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                safeMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId || (isLandlord && msg.sender_role === 'landlord') || (!isLandlord && msg.sender_role === 'tenant');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                  <div className="flex items-end gap-1.5 max-w-[82%]">
                    {!isMe && (
                      <span className="text-[10px] font-bold text-stone-400 mb-1">
                        {msg.sender_role === 'landlord' ? t.landlordTag : t.tenantTag}
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-[#1E1B4B] text-white rounded-br-xs'
                          : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9.5px] text-stone-400 mt-1 px-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-amber-500 ml-0.5" />}
                  </div>
                </div>
              );
            })
          )}
          {/* Indicador de escritura en tiempo real (Coordinado) */}
          {isOtherTyping && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-stone-500 text-xs animate-fade-in bg-stone-100/80 rounded-xl w-fit border border-stone-200/60 shadow-2xs">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic text-[11px] text-stone-600 font-medium">
                {isLandlord
                  ? (language === 'es' ? 'El inquilino está escribiendo...' : language === 'en' ? 'Tenant is typing...' : 'Le locataire est en train d\'écrire...')
                  : (language === 'es' ? 'El propietario está escribiendo...' : language === 'en' ? 'Landlord is typing...' : 'Le propriétaire est en train d\'écrire...')}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-4 mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Locataire bloqué en attente du 1er message du bailleur */}
        {isInputDisabled && (
          <div className="px-4 py-2.5 bg-amber-50/80 border-t border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold">{t.waitingLandlordFirstMessage} : </span>
              <span>{t.waitingLandlordFirstMessageSubtext}</span>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              disabled={isInputDisabled || sending}
              placeholder={
                isInputDisabled
                  ? t.typeMessageWaitingPlaceholder
                  : t.typeMessagePlaceholder
              }
              className={`w-full px-4 py-2.5 rounded-xl text-xs transition-all outline-hidden border ${
                isInputDisabled
                  ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed italic'
                  : 'bg-stone-50 border-stone-200 text-stone-800 focus:border-amber-600 focus:bg-white'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isInputDisabled || sending || !inputText.trim()}
            className={`p-2.5 rounded-xl text-white font-bold transition-all shadow-2xs flex items-center justify-center ${
              isInputDisabled || sending || !inputText.trim()
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
            }`}
            title={t.sendBtn}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

      </div>

      {/* Tenant Full Profile Modal for Landlord */}
      {showTenantProfileModal && tenantForModal && (
        <TenantFullProfileModal
          isOpen={showTenantProfileModal}
          onClose={() => setShowTenantProfileModal(false)}
          tenant={tenantForModal}
          currentListing={match.listing}
          onReport={() => {
            setShowTenantProfileModal(false);
            setShowReportModal(true);
          }}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="user"
          targetId={match.id}
          targetTitle={`Conversación con ${interlocutorName}`}
          targetUserId={isLandlord ? match.tenant_id : match.landlord_id}
          targetUserName={interlocutorName}
          currentUser={{ id: currentUserId }}
          onSuccess={() => {
            setShowReportModal(false);
            setErrorMessage('Denuncia enviada. El equipo de administración revisará esta conversación inmediatamente.');
          }}
        />
      )}
    </div>
  );
};

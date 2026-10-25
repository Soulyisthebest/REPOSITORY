import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Building, 
  Lock, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Search,
  RefreshCw
} from 'lucide-react';
import { MatchResult, TenantProfile } from '../types';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { MatchChatModal } from './MatchChatModal';

interface MatchesListViewProps {
  currentUserId: string;
  isLandlord: boolean;
  tenantProfile?: TenantProfile;
  language: Language;
  onExploreClick?: () => void;
}

export const MatchesListView: React.FC<MatchesListViewProps> = ({
  currentUserId,
  isLandlord,
  tenantProfile,
  language,
  onExploreClick,
}) => {
  const t = TRANSLATIONS[language];
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatMatch, setActiveChatMatch] = useState<MatchResult | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await api.matching.getMatches(currentUserId);
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.matches)
        ? (res as any).matches
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      setMatches(list);
    } catch (err) {
      console.error('Erreur chargement des matchs:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    // WebSocket en tiempo real para coordinación de matches y mensajes entrantes
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted || !currentUserId) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          ws?.send(
            JSON.stringify({
              type: 'join',
              userId: currentUserId,
              role: isLandlord ? 'landlord' : 'tenant',
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_incoming_message' || data.type === 'new_match_created') {
              fetchMatches();
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connectWs, 3500);
          }
        };
      } catch {}
    };

    connectWs();

    // BroadcastChannel local para sincronización entre pestañas abiertas
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('rentia_chat_sync');
        bc.onmessage = () => {
          if (isMounted) fetchMatches();
        };
      }
    } catch {}

    const handleLocalMsg = () => {
      if (isMounted) fetchMatches();
    };
    window.addEventListener('rentia_instant_message', handleLocalMsg);

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      if (bc) bc.close();
      window.removeEventListener('rentia_instant_message', handleLocalMsg);
    };
  }, [currentUserId, isLandlord]);

  const handleMatchUpdated = (updatedMatch: MatchResult) => {
    setMatches((prev) => {
      const prevList = Array.isArray(prev) ? prev : [];
      return prevList.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
    });
    if (activeChatMatch && activeChatMatch.id === updatedMatch.id) {
      setActiveChatMatch(updatedMatch);
    }
  };

  const safeMatches = Array.isArray(matches) ? matches : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">{t.chatModalTitle}</h1>
          </div>
          <p className="text-xs text-stone-500 max-w-lg">
            {t.chatModalSubtitle}
          </p>
        </div>

        <button
          onClick={fetchMatches}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'es' ? 'Actualizar' : language === 'en' ? 'Refresh' : 'Actualiser'}</span>
        </button>
      </div>

      {/* Matches List Container */}
      {loading && safeMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500">
            {language === 'es' 
              ? 'Cargando tus conversaciones verificadas...' 
              : language === 'en' 
              ? 'Loading your verified conversations...' 
              : 'Chargement de vos conversations vérifiées...'}
          </p>
        </div>
      ) : safeMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-stone-900">{t.noMatchesYetTitle}</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {t.noMatchesYetDesc}
            </p>
          </div>
          {onExploreClick && (
            <button
              onClick={onExploreClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{t.navExplore}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeMatches.map((m, idx) => {
            const interlocutorName = isLandlord
              ? m.tenant?.name || (language === 'es' ? 'Inquilino candidato' : language === 'en' ? 'Candidate tenant' : 'Locataire candidat')
              : m.landlord?.name || (language === 'es' ? 'Propietario verificado' : language === 'en' ? 'Verified landlord' : 'Propriétaire certifié');

            const isLockedForTenant = !isLandlord && !m.landlord_first_message_sent;

            return (
              <div
                key={`${m.id || 'match'}-${idx}`}
                onClick={() => setActiveChatMatch(m)}
                className="group bg-white rounded-3xl p-5 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
              >
                {/* Status chip */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-900 font-bold text-sm overflow-hidden">
                        {isLandlord && m.tenant?.avatar_url ? (
                          <img
                            src={m.tenant.avatar_url}
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
                        <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-800 transition-colors">
                          {interlocutorName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold">
                          {isLandlord ? t.tenantTag : t.landlordTag}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                        <Building className="w-3 h-3 text-amber-700" />
                        <span className="truncate max-w-[180px]">
                          {m.listing?.title || (language === 'es' ? 'Vivienda verificada' : language === 'en' ? 'Verified listing' : 'Logement certifié')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shrink-0">
                    {m.compatibility_score}%
                  </span>
                </div>

                {/* Status notice */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  {isLockedForTenant ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="text-[11px] truncate max-w-[210px]">
                        {t.waitingLandlordFirstMessage}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px]">
                        {language === 'es' 
                          ? 'Chat directo desbloqueado' 
                          : language === 'en' 
                          ? 'Direct chat unlocked' 
                          : 'Canal de messagerie déverrouillé'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs font-bold text-stone-600 group-hover:text-amber-700 transition-colors">
                    <span>{t.openChatBtn}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Chat Modal */}
      {activeChatMatch && (
        <MatchChatModal
          match={activeChatMatch}
          currentUserId={currentUserId}
          isLandlord={isLandlord}
          tenantProfile={tenantProfile}
          language={language}
          onClose={() => setActiveChatMatch(null)}
          onMatchUpdated={handleMatchUpdated}
        />
      )}
    </div>
  );
};

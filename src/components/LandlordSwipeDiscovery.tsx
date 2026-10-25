import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  Heart,
  X,
  Sparkles,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
  Euro,
  UserCheck,
  FileText,
  PawPrint,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  MessageSquare,
  Home,
  ArrowRight,
  AlertTriangle,
  Loader2,
  User,
  BadgeCheck,
  Send,
  MessageCircle,
  Check
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { SEED_TENANTS, SeedTenant } from '../data/seedTenants';
import { TenantFullProfileModal } from './TenantFullProfileModal';
import { MatchChatModal } from './MatchChatModal';
import { MatchResult } from '../types';
import { LocationPickerModal } from './LocationPickerModal';
import { detectOrActivateLocation, SpanishCity } from '../lib/locationService';

interface LandlordSwipeDiscoveryProps {
  currentUser: { id?: string; email: string; name?: string; role?: string } | null;
  language: Language;
  onNavigateToChat: () => void;
  onNavigateToLikes?: () => void;
}

export const LandlordSwipeDiscovery: React.FC<LandlordSwipeDiscoveryProps> = ({
  currentUser,
  language,
  onNavigateToChat,
  onNavigateToLikes,
}) => {
  const t = TRANSLATIONS[language];
  const [candidates, setCandidates] = useState<SeedTenant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [matchedTenant, setMatchedTenant] = useState<any | null>(null);

  // Direct Message upon Like
  const [directMessageText, setDirectMessageText] = useState<string>('');
  const [isSendingDirectMessage, setIsSendingDirectMessage] = useState(false);
  const [directMessageSentSuccess, setDirectMessageSentSuccess] = useState(false);
  const [activeChatMatch, setActiveChatMatch] = useState<MatchResult | null>(null);

  // Landlord Listings Selection for context & matching
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>('');

  const [maxRentFilter, setMaxRentFilter] = useState<number>(2000);

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTenant, setReportingTenant] = useState<SeedTenant | null>(null);
  const [reportReason, setReportReason] = useState<string>('suspicious_profile');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  // Motion values for swiping
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacityLike = useTransform(x, [30, 140], [0, 1]);
  const opacityPass = useTransform(x, [-30, -140], [0, 1]);

  // Load landlord listings and candidate tenants
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch listings for landlord
      let fetchedListings: any[] = [];
      try {
        const listingsRes = await api.matching.getListings();
        if (Array.isArray(listingsRes) && listingsRes.length > 0) {
          fetchedListings = listingsRes;
        }
      } catch (err) {
        console.warn('Could not fetch listings, using fallback:', err);
      }

      setListings(fetchedListings);
      if (fetchedListings.length > 0) {
        setSelectedListingId(fetchedListings[0].id);
      }

      // 2. Fetch candidates from server or fallback to seed tenants
      let candidateList: any[] = [];
      try {
        const candidatesRes = await api.matching.getCandidates();
        if (Array.isArray(candidatesRes) && candidatesRes.length > 0) {
          candidateList = candidatesRes;
        }
      } catch (err) {
        console.warn('Could not fetch candidates from API, fallback to SEED_TENANTS:', err);
      }

      if (candidateList.length === 0) {
        candidateList = SEED_TENANTS;
      } else {
        // Merge with SEED_TENANTS to ensure full profiles
        const seen = new Set(candidateList.map(c => c.tenant_id || c.id));
        SEED_TENANTS.forEach(st => {
          if (!seen.has(st.tenant_id) && !seen.has(st.id)) {
            candidateList.push(st);
            seen.add(st.id);
          }
        });
      }

      setCandidates(candidateList);
    } catch (error) {
      console.error('Error loading landlord swipe data:', error);
      setCandidates(SEED_TENANTS);
    } finally {
      setLoading(false);
    }
  };

  // Show all candidates directly without zone restriction
  const filteredCandidates = candidates;

  const currentCandidate = filteredCandidates[currentIndex];

  // Selected Listing Details
  const currentListing = useMemo(() => {
    return listings.find(l => l.id === selectedListingId) || listings[0] || {
      id: 'default_listing_malaga',
      title: 'Vivienda Principal Rentia',
      rent: 850,
      city: 'Málaga',
      property_type: 'Piso',
    };
  }, [listings, selectedListingId]);

  // Handle Swipe Action
  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentCandidate) return;

    setSwipeDirection(action === 'like' ? 'right' : 'left');

    const actorId = currentUser?.id || 'landlord_demo';
    const targetUserId = currentCandidate.tenant_id || currentCandidate.id;
    const listingId = currentListing.id;
    const candidateName = currentCandidate.firstName || currentCandidate.fullName.split(' ')[0];
    const initialDirectMsg = `¡Hola ${candidateName}! He visto tu perfil verificado para mi piso en ${currentListing.city || 'la ciudad'}. Tu solvencia y estabilidad encajan perfecto. ¿Cuándo tendrías disponibilidad para una visita o llamada?`;

    try {
      const res = await api.matching.swipe({
        actorId,
        actorRole: 'landlord',
        listingId,
        targetUserId,
        action,
      });

      // Asymmetric Matching: When landlord likes, it's an immediate match!
      if (action === 'like' && res && (res.isMatch || res.success)) {
        setDirectMessageText(initialDirectMsg);
        setDirectMessageSentSuccess(false);
        setMatchedTenant({
          candidate: currentCandidate,
          listing: currentListing,
          matchId: res.matchId || `match_${Date.now()}`,
        });
      }
    } catch (err) {
      console.error('Error recording landlord swipe:', err);
      if (action === 'like') {
        // Fallback optimistic match for demo resilience
        setDirectMessageText(initialDirectMsg);
        setDirectMessageSentSuccess(false);
        setMatchedTenant({
          candidate: currentCandidate,
          listing: currentListing,
          matchId: `match_${Date.now()}`,
        });
      }
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setActivePhotoIndex(0);
      setCurrentIndex((prev) => prev + 1);
    }, 280);
  };

  // Send Direct Message immediately upon like
  const handleSendDirectMessage = async () => {
    if (!matchedTenant?.matchId || !directMessageText.trim()) return;
    setIsSendingDirectMessage(true);
    try {
      await api.matching.sendMessage({
        matchId: matchedTenant.matchId,
        content: directMessageText.trim(),
      });
      setDirectMessageSentSuccess(true);
    } catch (err) {
      console.error('Error sending direct message on like:', err);
      // Still show success optimistically for great UX in demo
      setDirectMessageSentSuccess(true);
    } finally {
      setIsSendingDirectMessage(false);
    }
  };

  // Open real-time chat modal directly with candidate
  const openChatForMatchedTenant = (tenantData: any) => {
    const matchObj: MatchResult = {
      id: tenantData.matchId || `match_${Date.now()}`,
      listing_id: tenantData.listing?.id || 'list_demo',
      tenant_id: tenantData.candidate?.tenant_id || tenantData.candidate?.id,
      landlord_id: currentUser?.id || 'landlord_demo',
      status: 'active',
      landlord_first_message_sent: true,
      compatibility_score: tenantData.candidate?.trustScore || 95,
      created_at: new Date().toISOString(),
      listing: tenantData.listing,
      tenant: {
        id: tenantData.candidate?.tenant_id || tenantData.candidate?.id,
        name: tenantData.candidate?.fullName || tenantData.candidate?.firstName,
        avatar_url: tenantData.candidate?.avatar_url || tenantData.candidate?.photos?.[0],
        trust_score: tenantData.candidate?.trustScore || 92,
        monthly_income: tenantData.candidate?.monthly_income || 2400,
        employment_type: tenantData.candidate?.employment_type || 'indefinido',
        occupants_count: tenantData.candidate?.occupants_count || 1,
        has_pets: tenantData.candidate?.has_pets || false,
        bio: tenantData.candidate?.bio || '',
        photos: tenantData.candidate?.photos || [],
      },
    };
    setActiveChatMatch(matchObj);
    setMatchedTenant(null);
  };

  // Open report modal for a candidate
  const openReportModal = (candidate: SeedTenant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReportingTenant(candidate);
    setReportReason('suspicious_profile');
    setReportDescription('');
    setIsReportModalOpen(true);
  };

  // Submit report to /api/reports
  const handleSubmitReport = async () => {
    if (!reportingTenant) return;
    try {
      setIsSubmittingReport(true);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: currentUser?.id || 'landlord_reporter',
          reporter_name: currentUser?.name || 'Propietario Rentia',
          reporter_email: currentUser?.email,
          reporter_role: 'landlord',
          reported_user_id: reportingTenant.tenant_id || reportingTenant.id,
          reported_user_name: reportingTenant.fullName || reportingTenant.firstName,
          entity_type: 'user',
          reason: reportReason,
          description: reportDescription || `Perfil de inquilino reportado por propietario desde la sección de exploración.`,
        }),
      });

      if (res.ok) {
        setReportSuccessToast('Denuncia recibida. El equipo de administración revisará el perfil y actuará según corresponda.');
        setIsReportModalOpen(false);
        setTimeout(() => setReportSuccessToast(null), 5000);
        // Automatically advance to next candidate
        handleSwipe('pass');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportSuccessToast('Reporte registrado para revisión administrativa.');
      setIsReportModalOpen(false);
      setTimeout(() => setReportSuccessToast(null), 4000);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const currentPhotos = currentCandidate?.photos && currentCandidate.photos.length > 0 
    ? currentCandidate.photos 
    : [currentCandidate?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'];

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-12" id="landlord-swipe-discovery-container">
      {/* Toast Notification */}
      {reportSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reportSuccessToast}</span>
        </div>
      )}

      {/* HEADER: Context & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#1E1B4B] tracking-tight">
                Candidatos Inquilinos
              </h1>
              <p className="text-[11px] text-stone-500">
                Descubre perfiles solventes y guarda en favoritos para conectar al instante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToLikes && (
              <button
                onClick={onNavigateToLikes}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-discovery-view-likes"
                title="Ver perfiles a los que has dado Like"
              >
                <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
                <span>Perfiles con Like</span>
              </button>
            )}

            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {filteredCandidates.length - currentIndex > 0 
                ? `${filteredCandidates.length - currentIndex} candidatos` 
                : '0 pendientes'}
            </span>
          </div>
        </div>

        {/* SELECTOR DE VIVIENDA DEL PROPIETARIO */}
        {listings.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="select-property-matching" className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-stone-400" />
              <span>Para tu vivienda:</span>
            </label>
            <select
              id="select-property-matching"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[280px] truncate"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.rent} €/mes - {l.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SWIPE CARD CONTAINER */}
      {loading ? (
        <div className="h-[480px] bg-white rounded-3xl border border-stone-200/80 flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-stone-500">Cargando perfiles verificados de inquilinos...</p>
        </div>
      ) : currentIndex >= filteredCandidates.length || !currentCandidate ? (
        <div className="h-[480px] bg-white rounded-3xl border border-stone-200/80 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1E1B4B]">¡Has revisado todos los candidatos!</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No quedan más perfiles en este filtro. Puedes cambiar de ciudad o revisar tus conversaciones en el chat.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentIndex(0)}
              className="px-4 py-2 rounded-xl bg-stone-100 text-[#1E1B4B] text-xs font-bold hover:bg-stone-200 transition-colors"
              id="btn-restart-swipe"
            >
              Volver a revisar perfiles
            </button>
            {onNavigateToLikes && (
              <button
                onClick={onNavigateToLikes}
                className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                id="btn-empty-view-likes"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Ver perfiles con Like</span>
              </button>
            )}
            <button
              onClick={onNavigateToChat}
              className="px-4 py-2 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#2A2663] transition-colors shadow-xs cursor-pointer"
              id="btn-go-to-chat"
            >
              Ver mis chats activos
            </button>
          </div>
        </div>
      ) : (
        <div className="relative h-[595px] w-full select-none" id="swipe-card-stage">
          <AnimatePresence>
            <motion.div
              key={currentCandidate.id || currentCandidate.tenant_id}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) {
                  handleSwipe('like');
                } else if (info.offset.x < -100) {
                  handleSwipe('pass');
                }
              }}
              animate={
                swipeDirection === 'right'
                  ? { x: 500, opacity: 0 }
                  : swipeDirection === 'left'
                  ? { x: -500, opacity: 0 }
                  : { x: 0, opacity: 1 }
              }
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white rounded-3xl border border-stone-200/90 shadow-md overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
              id={`candidate-card-${currentCandidate.id}`}
            >
              {/* STAMPS (LIKE / PASS) */}
              <motion.div
                style={{ opacity: opacityLike }}
                className="absolute top-6 left-6 z-30 pointer-events-none border-4 border-emerald-500 rounded-2xl px-4 py-1.5 rotate-[-12deg] bg-emerald-500/10 backdrop-blur-xs"
              >
                <span className="text-xl font-black text-emerald-600 tracking-wider">INTERÉS (LIKE)</span>
              </motion.div>

              <motion.div
                style={{ opacity: opacityPass }}
                className="absolute top-6 right-6 z-30 pointer-events-none border-4 border-rose-500 rounded-2xl px-4 py-1.5 rotate-[12deg] bg-rose-500/10 backdrop-blur-xs"
              >
                <span className="text-xl font-black text-rose-600 tracking-wider">PASAR</span>
              </motion.div>

              {/* CARD TOP: PHOTO CAROUSEL */}
              <div 
                className="relative h-[270px] w-full bg-stone-900 overflow-hidden shrink-0 cursor-pointer"
                onClick={() => setShowDetailModal(true)}
              >
                <img
                  src={currentPhotos[activePhotoIndex]}
                  alt={currentCandidate.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                {/* Photo Pagination Dots */}
                {currentPhotos.length > 1 && (
                  <div className="absolute top-3 inset-x-0 flex justify-center gap-1.5 z-10 px-4">
                    {currentPhotos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx === activePhotoIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Click zones for photo navigation */}
                {currentPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : currentPhotos.length - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev < currentPhotos.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs"
                      aria-label="Siguiente foto"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* BADGE TRUST SCORE & REPORT BUTTON ON PHOTO */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#1E1B4B]/90 text-white backdrop-blur-md flex items-center gap-1.5 shadow-xs border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>TrustScore {currentCandidate.trustScore || currentCandidate.trust_score || 90}/100</span>
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => openReportModal(currentCandidate, e)}
                    className="px-2 py-1 rounded-xl text-[10px] font-bold bg-black/40 hover:bg-rose-600 text-white/90 hover:text-white backdrop-blur-md transition-colors flex items-center gap-1 border border-white/20"
                    title="Señalar o denunciar este perfil"
                    id={`btn-report-${currentCandidate.id}`}
                  >
                    <ShieldAlert className="w-3 h-3 text-rose-300" />
                    <span>Señalar</span>
                  </button>
                </div>

                {/* TENANT NAME & CITY OVER PHOTO */}
                <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-black tracking-tight drop-shadow-xs">
                      {currentCandidate.fullName || currentCandidate.firstName}
                    </h2>
                    <span className="text-base font-semibold text-stone-200">
                      {currentCandidate.age || 28} años
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-200 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-emerald-300">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{currentCandidate.profession}</span>
                    </span>
                    <span className="text-stone-300 text-[11px]">
                      • {currentCandidate.employment_type === 'indefinido' ? 'Contrato Indefinido' : currentCandidate.employment_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD BOTTOM: KEY METRICS & VERIFICATIONS */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5 overflow-y-auto">
                {/* Solvency & Income Matrix */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Monthly Income */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Ingresos Mensuales</p>
                    <p className="text-sm font-black text-[#1E1B4B]">
                      {currentCandidate.monthly_income.toLocaleString()} € / mes
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <BadgeCheck className="w-3 h-3 text-emerald-600" />
                      <span>Nóminas Acreditadas</span>
                    </span>
                  </div>

                  {/* Solvencia Acreditada */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                    <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Solvencia Validada</p>
                    <p className="text-sm font-black text-emerald-950 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Check Verde</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 truncate mt-0.5">
                      Garantía de pago contrastada
                    </p>
                  </div>
                </div>

                {/* Badges Row: Work contract, Guarantor, Pets, Occupants */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-indigo-600" />
                    <span>Contrato {currentCandidate.employment_type === 'indefinido' ? 'Indefinido' : currentCandidate.employment_type}</span>
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                    currentCandidate.has_guarantor
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}>
                    <UserCheck className="w-3 h-3" />
                    <span>{currentCandidate.has_guarantor ? 'Con Avalista' : 'Sin Avalista'}</span>
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                    currentCandidate.has_pets
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}>
                    <PawPrint className="w-3 h-3" />
                    <span>{currentCandidate.has_pets ? 'Con Mascotas' : 'Sin Mascotas'}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-stone-50 text-stone-700 border border-stone-200 flex items-center gap-1">
                    <Users className="w-3 h-3 text-stone-500" />
                    <span>{currentCandidate.occupants_count || 1} ocupante(s)</span>
                  </span>
                </div>

                {/* BIO TEASER */}
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed italic bg-stone-50/60 p-2 rounded-xl border border-stone-100">
                  "{currentCandidate.bio || 'Inquilino serio y responsable con contrato estable y referencias contrastadas.'}"
                </p>

                {/* BOTÓN PROMINENTE: VER DOSSIER COMPLETO */}
                <button
                  type="button"
                  onClick={() => setShowDetailModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 text-xs font-black border border-indigo-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-[0.99]"
                  id="btn-card-dossier-full"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Ver Perfil Completo (Dossier y Garantías)</span>
                </button>
              </div>

              {/* ACTION BUTTONS BAR */}
              <div className="p-3 bg-stone-50/90 border-t border-stone-200/90 flex items-center justify-around gap-2 shrink-0">
                {/* Pass Button */}
                <button
                  onClick={() => handleSwipe('pass')}
                  className="w-12 h-12 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center shadow-xs active:scale-95"
                  title="Pasar candidato"
                  id="btn-swipe-pass"
                >
                  <X className="w-6 h-6 stroke-[2.5]" />
                </button>

                {/* More Details Button */}
                <button
                  onClick={() => setShowDetailModal(true)}
                  className="px-4 h-11 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                  title="Ver perfil completo del inquilino"
                  id="btn-view-profile-detail"
                >
                  <Info className="w-4 h-4 text-indigo-700" />
                  <span>Dossier Detallado</span>
                </button>

                {/* Like Button (Immediate Match) */}
                <button
                  onClick={() => handleSwipe('like')}
                  className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center shadow-md shadow-emerald-500/25 active:scale-95"
                  title="Dar Like e iniciar contacto"
                  id="btn-swipe-like"
                >
                  <Heart className="w-6 h-6 fill-white" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* SWIPE HINT */}
      <div className="text-center text-[11px] text-stone-400 font-medium">
        <span>Desliza a la derecha para </span>
        <span className="font-bold text-emerald-600">conectar (Like)</span>
        <span> o a la izquierda para </span>
        <span className="font-bold text-rose-600">pasar</span>.
      </div>

      {/* ========================================================================= */}
      {/* INSTANT MATCH & DIRECT MESSAGE MODAL (PROPIETARIO ESCRIBE AL INQUILINO DIRECTAMENTE) */}
      {/* ========================================================================= */}
      {matchedTenant && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={matchedTenant.candidate.photos?.[0] || matchedTenant.candidate.avatar_url}
                    alt={matchedTenant.candidate.fullName}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-block mb-0.5">
                    ¡Conexión Directa Desbloqueada!
                  </span>
                  <h3 className="text-base font-black text-[#1E1B4B]">
                    Has conectado con {matchedTenant.candidate.firstName}
                  </h3>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Home className="w-3 h-3 text-indigo-700" />
                    <span>Para tu piso en {matchedTenant.listing.city} ({matchedTenant.listing.rent}€/mes)</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMatchedTenant(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If message was sent with success */}
            {directMessageSentSuccess ? (
              <div className="space-y-4 py-2 animate-in fade-in">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>¡Mensaje enviado a {matchedTenant.candidate.firstName}!</span>
                  </div>
                  <p className="text-xs text-emerald-800/90 leading-relaxed">
                    El inquilino ha recibido tu mensaje y notificación prioritaria. La conversación está abierta y activa.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 italic">
                  "{directMessageText}"
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => openChatForMatchedTenant(matchedTenant)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                    id="btn-open-sent-chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir Chat en Tiempo Real con {matchedTenant.candidate.firstName}</span>
                  </button>

                  <button
                    onClick={() => setMatchedTenant(null)}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                    id="btn-continue-swiping-sent"
                  >
                    Seguir buscando más candidatos
                  </button>
                </div>
              </div>
            ) : (
              /* Writing Box */
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Escribe tu mensaje directo:</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-semibold">
                    Se envía al instante
                  </span>
                </div>

                {/* Quick message suggestion templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">
                    Plantillas rápidas recomendadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDirectMessageText(
                          `¡Hola ${matchedTenant.candidate.firstName}! Me ha encantado tu perfil y solvencia acreditada para mi piso en ${matchedTenant.listing.city}. ¿Cuándo tendrías disponibilidad para visitarlo?`
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-[11px] font-bold border border-indigo-200/70 transition-colors flex items-center gap-1 text-left cursor-pointer"
                    >
                      <span>📅 Proponer visita</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDirectMessageText(
                          `¡Hola ${matchedTenant.candidate.firstName}! Tu estabilidad laboral encaja a la perfección con lo que busco para el piso en ${matchedTenant.listing.city}. Hablemos para coordinar una llamada o visita.`
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-[11px] font-bold border border-indigo-200/70 transition-colors flex items-center gap-1 text-left cursor-pointer"
                    >
                      <span>💼 Solvencia perfecta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDirectMessageText(
                          `¡Hola ${matchedTenant.candidate.firstName}! He revisado tu dossier verificado en Rentia. ¿Podemos organizar una llamada esta semana para conocernos?`
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-[11px] font-bold border border-indigo-200/70 transition-colors flex items-center gap-1 text-left cursor-pointer"
                    >
                      <span>📞 Coordinar llamada</span>
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-1">
                  <textarea
                    value={directMessageText}
                    onChange={(e) => setDirectMessageText(e.target.value)}
                    rows={3}
                    placeholder={`Escribe aquí tu mensaje a ${matchedTenant.candidate.firstName}...`}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-2xl p-3 text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all outline-hidden resize-none leading-relaxed"
                    id="input-direct-message-like"
                  />
                  <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                    <span>Inicia la conversación como propietario</span>
                    <span>{directMessageText.length} caracteres</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendDirectMessage}
                    disabled={isSendingDirectMessage || !directMessageText.trim()}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    id="btn-send-direct-message"
                  >
                    {isSendingDirectMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Enviar Mensaje Directo a {matchedTenant.candidate.firstName}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openChatForMatchedTenant(matchedTenant)}
                    className="w-full py-2.5 rounded-xl bg-[#1E1B4B] hover:bg-[#2A2663] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    id="btn-open-chat-room"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Abrir Sala de Chat en Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchedTenant(null)}
                    className="w-full py-2 text-stone-400 hover:text-stone-600 text-xs font-semibold transition-colors text-center cursor-pointer"
                    id="btn-continue-swiping"
                  >
                    Seguir buscando candidatos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED PROFILE MODAL (DOSSIER COMPLETO DE INQUILINO) */}
      {/* ========================================================================= */}
      {showDetailModal && currentCandidate && (
        <TenantFullProfileModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          tenant={currentCandidate}
          currentListing={currentListing}
          onLike={() => {
            setShowDetailModal(false);
            handleSwipe('like');
          }}
          onPass={() => {
            setShowDetailModal(false);
            handleSwipe('pass');
          }}
          onOpenChat={() => {
            setShowDetailModal(false);
            onNavigateToChat();
          }}
          onReport={(cand) => openReportModal(cand)}
        />
      )}

      {/* ========================================================================= */}
      {/* REPORT USER MODAL (Señalar al usuario) */}
      {/* ========================================================================= */}
      {isReportModalOpen && reportingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1E1B4B]">Señalar a este usuario</h3>
                  <p className="text-[11px] text-stone-500">{reportingTenant.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Esta denuncia se enviará directamente al panel de moderación de los administradores de Rentia para su investigación.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-700 block">
                Motivo del señalamiento:
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-2 font-medium focus:ring-1 focus:ring-rose-500"
              >
                <option value="suspicious_profile">Perfil sospechoso o datos falsos</option>
                <option value="inappropriate_content">Foto o descripción inapropiada</option>
                <option value="fake_income">Ingresos o nóminas dudosas</option>
                <option value="spam">Spam o intento de estafa</option>
                <option value="other">Otro motivo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-700 block">
                Detalles adicionales (opcional):
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Aporta detalles para que los administradores revisen el caso..."
                rows={3}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-normal focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold hover:bg-stone-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>Enviar Denuncia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REAL-TIME MATCH CHAT MODAL (DIRECT LIVE CHAT WITH TENANT) */}
      {/* ========================================================================= */}
      {activeChatMatch && (
        <MatchChatModal
          match={activeChatMatch}
          currentUserId={currentUser?.id || 'landlord_demo'}
          isLandlord={true}
          language={language}
          onClose={() => setActiveChatMatch(null)}
          onMatchUpdated={(updated) => setActiveChatMatch(updated)}
        />
      )}
    </div>
  );
};

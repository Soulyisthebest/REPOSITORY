import React, { useState, useEffect } from 'react';
import {
  Heart,
  Search,
  Building2,
  Euro,
  ArrowLeft,
  MessageSquare,
  Eye,
  Trash2,
  Sparkles,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Briefcase,
  Users,
  PawPrint,
  Calendar,
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { TenantFullProfileModal } from './TenantFullProfileModal';
import { MatchChatModal } from './MatchChatModal';
import { MatchResult } from '../types';

interface LandlordLikesViewProps {
  language: Language;
  currentUser: { id?: string; email: string; name?: string; role?: string } | null;
  onBack: () => void;
  onOpenDiscovery: () => void;
  onOpenChat?: (matchId?: string) => void;
}

export const LandlordLikesView: React.FC<LandlordLikesViewProps> = ({
  language,
  currentUser,
  onBack,
  onOpenDiscovery,
  onOpenChat,
}) => {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingFilter, setSelectedListingFilter] = useState('all');

  // Modals state
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<any | null>(null);
  const [activeChatMatch, setActiveChatMatch] = useState<MatchResult | null>(null);
  const [unlikingId, setUnlikingId] = useState<string | null>(null);

  const fetchLikes = async () => {
    setLoading(true);
    try {
      const data = await api.matching.getLandlordLikes({
        landlordId: currentUser?.id || 'landlord_demo',
      });
      setLikes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching landlord likes:', err);
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, [currentUser]);

  // Handle unlike (deshacer like)
  const handleUnlike = async (tenantId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('¿Deseas retirar este perfil de tus candidatos favoritos?')) return;

    setUnlikingId(tenantId);
    try {
      await api.matching.deleteLandlordLike(tenantId, {
        landlordId: currentUser?.id || 'landlord_demo',
      });
      setLikes((prev) => prev.filter((item) => item.candidate?.id !== tenantId && item.candidate?.tenant_id !== tenantId));
    } catch (err) {
      console.error('Error unliking candidate:', err);
      // Optimistic removal anyway
      setLikes((prev) => prev.filter((item) => item.candidate?.id !== tenantId && item.candidate?.tenant_id !== tenantId));
    } finally {
      setUnlikingId(null);
    }
  };

  // Open real-time chat with liked candidate
  const handleOpenChatWithCandidate = (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const candidate = item.candidate;
    const matchObj: MatchResult = {
      id: item.matchId || `match_${candidate.id || candidate.tenant_id}`,
      listing_id: item.listing?.id || 'list_demo',
      tenant_id: candidate.tenant_id || candidate.id,
      landlord_id: currentUser?.id || 'landlord_demo',
      status: 'active',
      landlord_first_message_sent: item.landlord_first_message_sent || true,
      compatibility_score: candidate.trustScore || 95,
      created_at: item.liked_at || new Date().toISOString(),
      listing: item.listing,
      tenant: {
        id: candidate.tenant_id || candidate.id,
        name: candidate.fullName || candidate.firstName,
        avatar_url: candidate.avatar_url || candidate.photos?.[0],
        trust_score: candidate.trustScore || candidate.trust_score || 92,
        monthly_income: candidate.monthly_income || 2400,
        employment_type: candidate.employment_type || 'indefinido',
        occupants_count: candidate.occupants_count || 1,
        has_pets: candidate.has_pets || false,
        bio: candidate.bio || '',
        photos: candidate.photos || [],
      },
    };
    setActiveChatMatch(matchObj);
  };

  // Extract unique listings for the filter dropdown
  const uniqueListings = Array.from(
    new Map(
      likes
        .filter((item) => item.listing?.id)
        .map((item) => [item.listing.id, item.listing])
    ).values()
  );

  // Filtered likes by search query and listing
  const filteredLikes = likes.filter((item) => {
    const candidate = item.candidate;
    if (!candidate) return false;

    // Filter by listing
    if (selectedListingFilter !== 'all' && item.listing?.id !== selectedListingFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = candidate.fullName?.toLowerCase().includes(q) || candidate.firstName?.toLowerCase().includes(q);
      const matchJob = candidate.profession?.toLowerCase().includes(q) || candidate.employment_type?.toLowerCase().includes(q);
      const matchCity = candidate.target_city?.toLowerCase().includes(q) || item.listing?.city?.toLowerCase().includes(q);
      if (!matchName && !matchJob && !matchCity) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors shrink-0 cursor-pointer"
            id="btn-back-from-landlord-likes"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-[#1E1B4B]">Candidatos Favoritos</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>{likes.length} {likes.length === 1 ? 'candidato' : 'candidatos'}</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Inquilinos verificados que has guardado en favoritos. Tienes canal directo desbloqueado para chatear y proponer visitas.
            </p>
          </div>
        </div>

        {/* Action Button: Discover More */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDiscovery}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
            id="btn-likes-go-to-swipe"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Descubrir Más Inquilinos</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, profesión o ciudad..."
            className="w-full bg-white border border-stone-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs"
            id="input-search-liked-tenants"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Listing filter */}
        <div className="relative">
          <select
            value={selectedListingFilter}
            onChange={(e) => setSelectedListingFilter(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl py-2.5 px-3.5 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs cursor-pointer appearance-none"
            id="select-filter-by-listing"
          >
            <option value="all">🏢 Todos tus inmuebles ({likes.length})</option>
            {uniqueListings.map((listing: any) => (
              <option key={listing.id} value={listing.id}>
                📍 {listing.city} - {listing.title || 'Inmueble'} ({listing.rent}€)
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-stone-500 font-semibold">Cargando candidatos favoritos...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLikes.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 fill-rose-500/20" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-[#1E1B4B]">
              {searchQuery || selectedListingFilter !== 'all'
                ? 'No hay candidatos con los filtros seleccionados'
                : 'Aún no has guardado a ningún candidato en favoritos'}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {searchQuery || selectedListingFilter !== 'all'
                ? 'Prueba a cambiar el texto de búsqueda o seleccionar otro inmueble de tu lista.'
                : 'Explora perfiles verificados con nóminas y solvencia acreditada en el radar de inquilinos para conectar al instante.'}
            </p>
          </div>

          <div className="pt-2">
            {searchQuery || selectedListingFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedListingFilter('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                onClick={onOpenDiscovery}
                className="px-6 py-3 rounded-2xl bg-[#1E1B4B] hover:bg-[#2A2663] text-white text-xs font-black transition-all shadow-md shadow-indigo-950/20 inline-flex items-center gap-2 cursor-pointer active:scale-98"
                id="btn-empty-go-discover"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Explorar Candidatos Verificados</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      {!loading && filteredLikes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLikes.map((item) => {
            const candidate = item.candidate;
            const listing = item.listing;
            const candidateId = candidate.id || candidate.tenant_id;
            const photoUrl = candidate.photos?.[0] || candidate.avatar_url;

            return (
              <div
                key={candidateId}
                className="bg-white rounded-3xl border border-stone-200/90 hover:border-indigo-300 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col group"
                id={`liked-tenant-card-${candidateId}`}
              >
                {/* Image & Header Overlay */}
                <div className="relative h-48 bg-stone-900 overflow-hidden cursor-pointer" onClick={() => setSelectedCandidateForProfile(candidate)}>
                  <img
                    src={photoUrl}
                    alt={candidate.fullName}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verificado Rentia</span>
                    </span>

                    <button
                      onClick={(e) => handleUnlike(candidateId, e)}
                      disabled={unlikingId === candidateId}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-rose-600 backdrop-blur-sm text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Retirar Like"
                    >
                      {unlikingId === candidateId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Bottom Image Overlay: Candidate Name & Trust Score */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <h3 className="text-base font-black flex items-center gap-1.5 drop-shadow-sm">
                        <span>{candidate.fullName}</span>
                        {candidate.age && (
                          <span className="text-xs font-normal text-white/80">({candidate.age} años)</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 drop-shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Score: {candidate.trustScore || candidate.trust_score || 92}/100 A+</span>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Heart className="w-3 h-3 fill-white" />
                      <span>Liked</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Property Context Badge */}
                    {listing && (
                      <div className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span className="font-bold text-indigo-950 truncate">
                            Para: {listing.city} {listing.title ? `• ${listing.title}` : ''}
                          </span>
                        </div>
                        <span className="font-black text-indigo-900 shrink-0 pl-1">
                          {listing.rent}€/m
                        </span>
                      </div>
                    )}

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Income */}
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                        <Euro className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase leading-none">Ingresos</span>
                          <span className="font-black text-stone-800 text-xs">
                            {candidate.monthly_income ? `${candidate.monthly_income} €/mes` : 'Acreditados'}
                          </span>
                        </div>
                      </div>

                      {/* Employment */}
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase leading-none">Contrato</span>
                          <span className="font-black text-stone-800 text-xs capitalize truncate">
                            {candidate.employment_type || 'Indefinido'}
                          </span>
                        </div>
                      </div>

                      {/* Occupants */}
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase leading-none">Ocupantes</span>
                          <span className="font-black text-stone-800 text-xs">
                            {candidate.occupants_count || 1} {candidate.occupants_count === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                      </div>

                      {/* Pets */}
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                        <PawPrint className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-stone-400 font-bold block uppercase leading-none">Mascotas</span>
                          <span className="font-black text-stone-800 text-xs">
                            {candidate.has_pets ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {candidate.bio && (
                      <p className="text-xs text-stone-600 line-clamp-2 italic leading-relaxed pt-1">
                        "{candidate.bio}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                    {/* Open Live Chat */}
                    <button
                      onClick={(e) => handleOpenChatWithCandidate(item, e)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      id={`btn-chat-liked-${candidateId}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Abrir Chat</span>
                    </button>

                    {/* View Full Dossier */}
                    <button
                      onClick={() => setSelectedCandidateForProfile(candidate)}
                      className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Ver Dossier Completo"
                      id={`btn-dossier-liked-${candidateId}`}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ver Perfil</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TENANT FULL PROFILE DOSSIER MODAL */}
      {/* ========================================================================= */}
      {selectedCandidateForProfile && (
        <TenantFullProfileModal
          isOpen={true}
          tenant={selectedCandidateForProfile}
          onClose={() => setSelectedCandidateForProfile(null)}
          onOpenChat={() => {
            const item = likes.find(
              (l) => l.candidate?.id === selectedCandidateForProfile.id || l.candidate?.tenant_id === selectedCandidateForProfile.tenant_id
            );
            setSelectedCandidateForProfile(null);
            if (item) {
              handleOpenChatWithCandidate(item);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* REAL-TIME MATCH CHAT MODAL */}
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

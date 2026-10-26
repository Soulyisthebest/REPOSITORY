import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  MapPin, 
  BedDouble, 
  Search, 
  Loader2, 
  Home, 
  Flag, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Filter,
  Check,
  Power,
  Lock,
  Unlock,
  Calendar,
  QrCode,
  Share2,
  Settings,
  Eye,
  EyeOff,
  X,
  Phone,
  Mail,
  PawPrint
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { CreateListingModal } from './CreateListingModal';
import { ReportModal } from './ReportModal';
import { KycVerificationModal } from './KycVerificationModal';
import { Listing } from '../types';
import { SEED_LISTINGS } from '../data/mockData';

interface LandlordDashboardProps {
  currentUser: { 
    id: string; 
    email: string; 
    name?: string;
    role?: string;
    phone?: string;
    is_verified?: boolean;
    verification_status?: string;
  };
  onNavigateToChat: () => void;
  onNavigateToSwipe?: () => void;
  onNavigateToPublish?: () => void;
  language: Language;
}

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  currentUser,
  onNavigateToChat,
  onNavigateToSwipe,
  onNavigateToPublish,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'inactive' | 'scheduled'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'long_term' | 'short_stay'>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'apartment' | 'studio' | 'house' | 'room' | 'penthouse'>('all');
  const [contactSuccessToast, setContactSuccessToast] = useState<string | null>(null);

  const [showKycModal, setShowKycModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'listing' | 'user';
    id: string;
    title?: string;
    userId?: string;
    userName?: string;
  } | null>(null);

  // Landlord profile & QR code state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showProfileConfigModal, setShowProfileConfigModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [landlordCharacteristics, setLandlordCharacteristics] = useState<{
    showPhone: boolean;
    showEmail: boolean;
    showVerification: boolean;
    showPropertiesCount: boolean;
    showPetPolicy: boolean;
    showHours: boolean;
    petPolicyText: string;
    contactHours: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(`rentia_landlord_profile_${currentUser?.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showPhone: true,
      showEmail: true,
      showVerification: true,
      showPropertiesCount: true,
      showPetPolicy: true,
      showHours: true,
      petPolicyText: 'Permite mascotas según vivienda',
      contactHours: '9:00 - 20:00 (L-V)',
    };
  });

  const handleToggleCharacteristic = (key: 'showPhone' | 'showEmail' | 'showVerification' | 'showPropertiesCount' | 'showPetPolicy' | 'showHours') => {
    setLandlordCharacteristics((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`rentia_landlord_profile_${currentUser?.id || 'default'}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const profileCode = currentUser?.id ? `PROP-${currentUser.id.substring(0, 4).toUpperCase()}` : 'PROP-DEMO';
  const landlordQrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${profileCode}`
    : `https://rentia.es/p/${profileCode}`;

  const isLandlordVerified = currentUser?.is_verified || currentUser?.verification_status === 'verified';

  useEffect(() => {
    fetchListings();
  }, []);

    const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.matching.getListings({ include_inactive: true });
      const rawList = Array.isArray(res) && res.length > 0 ? res : [];
      const seen = new Set<string>();
      const myProperties = rawList.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        seen.add(l.id);
        if (!currentUser?.id && !currentUser?.email) return false;
        const matchesId = currentUser.id && (l.landlord_id === currentUser.id || l.user_id === currentUser.id);
        const matchesEmail = currentUser.email && (
          (l.landlord_email && l.landlord_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (l.landlord_id && l.landlord_id.toLowerCase() === currentUser.email.toLowerCase())
        );
        return Boolean(matchesId || matchesEmail);
      });
      setListings(myProperties);
    } catch (err) {
      console.warn('Error fetching landlord listings:', err);
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const toggleActiveStatus = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = listings.find(l => l.id === id);
    if (!current) return;
    const willBeActive = current.is_active === false;
    const nextStatus = willBeActive ? (current.status === 'rented' ? 'rented' : 'available') : 'inactive';

    setListings(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, is_active: willBeActive, status: nextStatus };
      }
      return l;
    }));

    try {
      await api.matching.toggleListingStatus(id, willBeActive, nextStatus);
      setContactSuccessToast(
        willBeActive ? '🟢 Anuncio activado con 1 clic' : '⏸️ Anuncio desactivado / en pausa con 1 clic'
      );
      setTimeout(() => setContactSuccessToast(null), 3500);
    } catch {
      // already set in UI
    }
  };

  const toggleListingStatus = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = listings.find(l => l.id === id);
    if (!current) return;
    const isCurrentlyRented = current.status === 'rented';
    const nextStatus = isCurrentlyRented ? 'available' : 'rented';

    setListings(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, status: nextStatus, is_active: true };
      }
      return l;
    }));

    try {
      await api.matching.toggleListingStatus(id, true, nextStatus);
      setContactSuccessToast(
        isCurrentlyRented ? '🟢 Anuncio marcado como DISPONIBLE con 1 clic' : '🔒 Anuncio marcado como ALQUILADO con 1 clic'
      );
      setTimeout(() => setContactSuccessToast(null), 3500);
    } catch {
      // already set in UI
    }
  };

  const filteredListings = listings.filter((l) => {
    // Status filter
    if (statusFilter === 'available' && (l.is_active === false || l.status === 'rented' || l.status === 'inactive' || (l.is_scheduled && l.publishing_status === 'scheduled'))) return false;
    if (statusFilter === 'rented' && l.status !== 'rented') return false;
    if (statusFilter === 'inactive' && l.is_active !== false && l.status !== 'inactive') return false;
    if (statusFilter === 'scheduled' && (!l.is_scheduled || l.publishing_status !== 'scheduled')) return false;

    // Rental duration filter: 'all' | 'long_term' | 'short_stay'
    if (durationFilter !== 'all') {
      const isShort = l.rental_duration_type === 'short_stay';
      if (durationFilter === 'short_stay' && !isShort) return false;
      if (durationFilter === 'long_term' && isShort) return false;
    }

    // Property type filter: 'all' | 'apartment' | 'studio' | 'house' | 'room' | 'penthouse'
    if (propertyTypeFilter !== 'all') {
      if (l.property_type !== propertyTypeFilter) return false;
    }

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = (l.title || '').toLowerCase().includes(term);
    const cityMatch = (l.city || '').toLowerCase().includes(term);
    const neighborhoodMatch = (l.neighborhood || '').toLowerCase().includes(term);
    return titleMatch || cityMatch || neighborhoodMatch;
  });

  const availableCount = listings.filter(l => l.is_active !== false && l.status !== 'rented' && l.status !== 'inactive' && !(l.is_scheduled && l.publishing_status === 'scheduled')).length;
  const rentedCount = listings.filter(l => l.status === 'rented').length;
  const inactiveCount = listings.filter(l => l.is_active === false || l.status === 'inactive').length;
  const scheduledCount = listings.filter(l => l.is_scheduled && l.publishing_status === 'scheduled').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" id="landlord-listings-section">
      
      {/* Toast feedback */}
      {contactSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{contactSuccessToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setContactSuccessToast(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header: Apartado de Anuncios */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs shrink-0">
              <Home className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-[#1E1B4B] tracking-tight">
                  Mis Anuncios
                </h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  currentUser?.role === 'agency'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {currentUser?.role === 'agency' ? t.roleBadgeAgency : t.roleBadgeLandlord}
                </span>
                {isLandlordVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check Verde Verificado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>DNI sin validar</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Gestiona tus viviendas en alquiler, publica nuevos anuncios y administra su disponibilidad
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isLandlordVerified && (
              <button
                type="button"
                onClick={() => setShowKycModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verificar mi DNI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onNavigateToPublish) {
                  onNavigateToPublish();
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              id="btn-landlord-create-listing"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              <span>{t.publishListingModalBtn}</span>
            </button>
          </div>

        </div>

        {/* 4 Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100 text-center">
          <div>
            <span className="block text-xl sm:text-2xl font-black text-[#1E1B4B]">
              {listings.length}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.activeListingsCount}
            </span>
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-black text-emerald-600">
              {availableCount}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Disponibles
            </span>
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-black text-amber-600">
              {rentedCount}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Alquilados / Reservados
            </span>
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-black text-indigo-600">
              {scheduledCount}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Programados
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN MI PERFIL PROFESIONAL & CÓDIGO QR */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0FA3A3] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 relative">
              <Building2 className="w-6 h-6" />
              {isLandlordVerified && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#1E1B4B]">
                  {currentUser?.name || (currentUser?.role === 'agency' ? 'Agencia Inmobiliaria' : 'Propietario Verificado')}
                </h2>
                {isLandlordVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check Verde Verificado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                    <span>Titularidad pendiente</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowProfileConfigModal(true)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-stone-500" />
              <span>Configurar datos del perfil</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(landlordQrUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{copiedLink ? '¡Enlace copiado!' : 'Compartir perfil'}</span>
            </button>
          </div>
        </div>

        {/* Characteristics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Teléfono directo</span>
              {!landlordCharacteristics.showPhone && <EyeOff className="w-3 h-3 text-stone-300" />}
            </div>
            <span className="font-bold text-[#1E1B4B] block mt-1 truncate">
              {landlordCharacteristics.showPhone ? (currentUser.phone || 'Disponible para inquilinos') : 'Oculto por privacidad'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Inmuebles Activos</span>
              {!landlordCharacteristics.showPropertiesCount && <EyeOff className="w-3 h-3 text-stone-300" />}
            </div>
            <span className="font-black text-emerald-700 block mt-1">
              {landlordCharacteristics.showPropertiesCount ? `${listings.length} viviendas registradas` : 'Privado'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Política de mascotas</span>
              {!landlordCharacteristics.showPetPolicy && <EyeOff className="w-3 h-3 text-stone-300" />}
            </div>
            <span className="font-bold text-[#1E1B4B] block mt-1 truncate">
              {landlordCharacteristics.showPetPolicy ? landlordCharacteristics.petPolicyText : 'Consultar en privado'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Horario de contacto</span>
              {!landlordCharacteristics.showHours && <EyeOff className="w-3 h-3 text-stone-300" />}
            </div>
            <span className="font-bold text-[#1E1B4B] block mt-1 truncate">
              {landlordCharacteristics.showHours ? landlordCharacteristics.contactHours : 'Flexible'}
            </span>
          </div>
        </div>

        {/* QR Code Bar */}
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#0FA3A3]" />
              <h3 className="text-xs font-bold text-[#1E1B4B]">
                {currentUser?.role === 'agency' ? 'Código QR de Agencia Inmobiliaria' : 'Código QR de Propietario'}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 max-w-sm leading-relaxed">
              Los inquilinos pueden escanear tu código QR para verificar la autenticidad de tus viviendas y contactarte de forma directa y segura.
            </p>
            <button
              onClick={() => setShowQrModal(true)}
              className="text-[11px] text-[#0FA3A3] font-bold hover:underline"
            >
              Ampliar código QR
            </button>
          </div>

          <div
            onClick={() => setShowQrModal(true)}
            className="p-2 bg-white rounded-xl border border-stone-200 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
            title="Haz clic para ampliar el código QR"
          >
            <QRCodeSVG
              value={landlordQrUrl}
              size={64}
              bgColor="#FFFFFF"
              fgColor="#1E1B4B"
              level="M"
            />
          </div>
        </div>
      </div>

      {/* Security Notice Banner if Landlord is Unverified */}
      {!isLandlordVerified && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-900">
                  Verificación de Identidad Requerida para Contactar Inquilinos
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black uppercase">
                  Regla de Seguridad
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                Tus anuncios son visibles para todos los inquilinos. Para contactarles directamente o iniciar conversaciones por chat, el administrador debe validar tu documento de identidad (Check Verde).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKycModal(true)}
            className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Subir DNI y Foto</span>
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
        
        {/* Top filter row: Status Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#1E1B4B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
              }`}
            >
              Todos ({listings.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'available'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
              }`}
            >
              Disponibles ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rented')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'rented'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-700 hover:bg-stone-50'
              }`}
            >
              Alquilados ({rentedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'scheduled'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-indigo-700 hover:bg-stone-50'
              }`}
            >
              Programados ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'inactive'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              Desactivados ({inactiveCount})
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por título, ciudad o barrio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] focus:bg-white"
            />
          </div>
        </div>

        {/* Second filter row: Agency / Landlord Duration & Property Type Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-100">
          {/* Duration Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>Estancia:</span>
            </span>
            <button
              type="button"
              onClick={() => setDurationFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                durationFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setDurationFilter('long_term')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                durationFilter === 'long_term'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span>🏠 Larga duración</span>
            </button>
            <button
              type="button"
              onClick={() => setDurationFilter('short_stay')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                durationFilter === 'short_stay'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>⚡ Corta estancia</span>
            </button>
          </div>

          {/* Property Type Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-stone-400" />
              <span>Tipo de inmueble:</span>
            </span>
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs text-[#1E1B4B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
            >
              <option value="all">Todos los tipos</option>
              <option value="apartment">🏢 Piso / Apartamento</option>
              <option value="studio">🛋️ Estudio</option>
              <option value="house">🏡 Casa / Chalet</option>
              <option value="room">🚪 Habitación</option>
              <option value="penthouse">✨ Ático</option>
            </select>
          </div>
        </div>

      </div>

      {/* Listings Grid */}
      <div className="space-y-4">
        {loadingListings ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E1B4B] mb-2" />
            <p className="text-xs text-stone-500 font-medium">{t.loadingProperties}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            {searchTerm.trim() ? (
              <>
                <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  Sin resultados para "{searchTerm}"
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Prueba a buscar con otros términos como ciudad o barrio.
                </p>
              </>
            ) : statusFilter === 'rented' ? (
              <>
                <Lock className="w-10 h-10 text-amber-500/70 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles alquilados
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Aquí aparecerán las viviendas que marques como alquiladas o reservadas en tu cartera.
                </p>
              </>
            ) : statusFilter === 'inactive' ? (
              <>
                <Power className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles desactivados
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Aquí aparecerán los anuncios que pauses o desactives temporalmente.
                </p>
              </>
            ) : statusFilter === 'available' ? (
              <>
                <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles disponibles
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Actualmente no tienes ningún anuncio activo en alquiler.
                </p>
              </>
            ) : (
              <>
                <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  {t.noListingsPublishedYet}
                </h3>
                <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
                  Tus propiedades son privadas. Crea tu primer anuncio para controlar y gestionar tus propiedades.
                </p>
                {onNavigateToPublish && (
                  <button
                    type="button"
                    onClick={onNavigateToPublish}
                    className="px-4 py-2 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    id="btn-go-to-publish-tab"
                  >
                    <Plus className="w-4 h-4 text-[#D97706]" />
                    <span>Crear anuncio</span>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing, idx) => {
              const isRented = listing.status === 'rented';
              const isInactive = listing.is_active === false || listing.status === 'inactive';

              return (
                <div 
                  key={`${listing.id}-${idx}`}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Photo or Placeholder */}
                  <div className="h-44 bg-stone-100 relative overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        className={`w-full h-full object-cover transition-transform hover:scale-105 duration-300 ${isInactive ? 'grayscale opacity-60' : isRented ? 'grayscale-50 opacity-70' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 text-[#1E1B4B]">
                        <Home className="w-10 h-10 text-stone-300" />
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#1E1B4B]/90 backdrop-blur-xs text-white text-xs font-black">
                      {listing.rent} {listing.currency || '€'} / {t.perMonthSuffix}
                    </div>

                    {/* Status Tag */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                      {listing.is_scheduled && listing.publishing_status === 'scheduled' ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-700/90 backdrop-blur-xs text-indigo-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Clock className="w-2.5 h-2.5 text-indigo-300" />
                          Programado
                        </span>
                      ) : isInactive ? (
                        <span className="px-2 py-0.5 rounded-full bg-stone-800/90 backdrop-blur-xs text-stone-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Power className="w-2.5 h-2.5 text-stone-400" />
                          Desactivado
                        </span>
                      ) : isRented ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-900/80 backdrop-blur-xs text-amber-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-300" />
                          Alquilado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700/90 backdrop-blur-xs text-emerald-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-300" />
                          Disponible
                        </span>
                      )}

                      {/* Duration Tag */}
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide backdrop-blur-xs shadow-xs ${
                        listing.rental_duration_type === 'short_stay'
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}>
                        {listing.rental_duration_type === 'short_stay' ? '⚡ Corta' : '🏠 Larga'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1E1B4B] line-clamp-1 mb-1" title={listing.title}>
                        {listing.title}
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{listing.city} {listing.neighborhood ? `• ${listing.neighborhood}` : ''}</span>
                      </p>

                      {/* Rooms and Property Type */}
                      <div className="flex items-center gap-2 text-xs text-stone-600 mb-2">
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                          <span>{listing.rooms_count || 1} {t.roomsSuffix}</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize font-medium">
                          {listing.property_type === 'house'
                            ? '🏡 Casa'
                            : listing.property_type === 'studio'
                            ? '🛋️ Estudio'
                            : listing.property_type === 'room'
                            ? '🚪 Habitación'
                            : listing.property_type === 'penthouse'
                            ? '✨ Ático'
                            : '🏢 Piso'}
                        </span>
                      </div>

                      {/* Duration & Availability Info */}
                      <div className="bg-stone-50 rounded-xl p-2 border border-stone-200/70 text-[11px] space-y-1 mb-2">
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-semibold text-stone-500">Estancia:</span>
                          <span className="font-bold">
                            {listing.rental_duration_type === 'short_stay' ? 'Corta estancia' : 'Larga duración'}
                            {listing.is_indefinite
                              ? ' (Indefinido)'
                              : listing.duration_value
                              ? ` (${listing.duration_value} ${listing.duration_unit === 'years' ? 'años' : 'meses'})`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600">
                          <span className="font-semibold text-stone-500">Disponibilidad:</span>
                          <span className="truncate">
                            {listing.available_from
                              ? `Desde ${new Date(listing.available_from).toLocaleDateString()}`
                              : 'Inmediata'}
                            {listing.available_until
                              ? ` hasta ${new Date(listing.available_until).toLocaleDateString()}`
                              : ''}
                          </span>
                        </div>
                        {listing.is_scheduled && listing.scheduled_publish_at && (
                          <div className="flex items-center justify-between text-indigo-700 pt-0.5 border-t border-stone-200/50">
                            <span className="font-semibold text-indigo-500">Publicación:</span>
                            <span className="font-bold">
                              {new Date(listing.scheduled_publish_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on this listing */}
                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        {/* 1-click Activate / Deactivate button */}
                        <button
                          type="button"
                          onClick={(e) => toggleActiveStatus(listing.id, e)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            isInactive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                          title={isInactive ? 'Activar anuncio con 1 clic' : 'Desactivar anuncio con 1 clic'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isInactive ? 'Activar' : 'Desactivar'}</span>
                        </button>

                        {/* 1-click Mark Available / Rented button */}
                        <button
                          type="button"
                          onClick={(e) => toggleListingStatus(listing.id, e)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            isRented
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={isRented ? 'Marcar como disponible con 1 clic' : 'Marcar como alquilado con 1 clic'}
                        >
                          {isRented ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Disponible</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Alquilado</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReportTarget({
                              type: 'listing',
                              id: listing.id,
                              title: listing.title,
                              userId: listing.landlord_id || (listing as any).owner_id || ''
                            });
                            setShowReportModal(true);
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-auto"
                          title="Denunciar anuncio"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Direct action to Swipe Candidates for this property */}
                      {onNavigateToSwipe && (
                        <button
                          type="button"
                          onClick={onNavigateToSwipe}
                          className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Buscar candidatos</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Listing */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListingCreated={() => {
          setShowCreateModal(false);
          fetchListings();
        }}
        currentUserId={currentUser.id}
        language={language}
      />

      {/* Modal: KYC Verification (Upload DNI and selfie for green check) */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        currentUser={currentUser}
        onVerificationSubmitted={() => {
          setShowKycModal(false);
          setContactSuccessToast('DNI y fotografía enviados con éxito. El administrador revisará tu cuenta.');
          setTimeout(() => setContactSuccessToast(null), 5000);
        }}
      />

      {/* Modal: Report (Scams, fake listings, fraudulent profiles) */}
      {reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetUserId={reportTarget.userId}
          targetUserName={reportTarget.userName}
          currentUser={currentUser}
          onSuccess={() => {
            setShowReportModal(false);
            setReportTarget(null);
            setContactSuccessToast('Denuncia recibida. El equipo de administración revisará el caso inmediatamente.');
            setTimeout(() => setContactSuccessToast(null), 5000);
          }}
        />
      )}
      {/* Fullscreen Landlord QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-stone-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E1B4B]">
                {currentUser?.role === 'agency' ? 'QR de Agencia Inmobiliaria' : 'QR de Propietario'}
              </h3>
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-stone-200 inline-block shadow-inner">
              <QRCodeSVG
                value={landlordQrUrl}
                size={200}
                bgColor="#FAF9F6"
                fgColor="#1E1B4B"
                level="Q"
              />
            </div>
            
            <p className="text-[10px] text-stone-500 font-mono break-all">{landlordQrUrl}</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Características de Propietario / Agencia */}
      {showProfileConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#0FA3A3]" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">
                  Características Públicas del Perfil
                </h3>
              </div>
              <button 
                onClick={() => setShowProfileConfigModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Como propietario o agencia, decide qué características mostrar a los inquilinos cuando escanean tu código QR:
            </p>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0FA3A3]" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Teléfono de contacto</span>
                    <span className="text-[10px] text-stone-400">Mostrar teléfono a los candidatos en su perfil</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={landlordCharacteristics.showPhone}
                  onChange={() => handleToggleCharacteristic('showPhone')}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Número de inmuebles activos</span>
                    <span className="text-[10px] text-stone-400">Mostrar cuántas viviendas gestionas</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={landlordCharacteristics.showPropertiesCount}
                  onChange={() => handleToggleCharacteristic('showPropertiesCount')}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Política de mascotas</span>
                    <span className="text-[10px] text-stone-400">Informar si aceptas mascotas en tus propiedades</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={landlordCharacteristics.showPetPolicy}
                  onChange={() => handleToggleCharacteristic('showPetPolicy')}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Horario de atención</span>
                    <span className="text-[10px] text-stone-400">Indicar franja de contacto a candidatos</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={landlordCharacteristics.showHours}
                  onChange={() => handleToggleCharacteristic('showHours')}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.public.updateProfileVisibility({
                      show_phone: landlordCharacteristics.showPhone,
                      show_email: landlordCharacteristics.showEmail,
                      show_listings: landlordCharacteristics.showPropertiesCount,
                    });
                  } catch {}
                  setShowProfileConfigModal(false);
                }}
                className="flex-1 py-2.5 bg-[#0FA3A3] hover:bg-[#0d8c8c] text-white rounded-xl text-xs font-bold transition-all"
              >
                Guardar preferencias
              </button>
              <a
                href={landlordQrUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="Abrir y probar perfil público"
              >
                Probar QR
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

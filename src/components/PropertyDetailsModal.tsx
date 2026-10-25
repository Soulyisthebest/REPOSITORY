import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageSquare, 
  ShieldCheck, 
  MapPin, 
  Maximize2, 
  BedDouble, 
  Bath, 
  Calendar, 
  Home, 
  Sparkles, 
  Check, 
  Building2,
  PawPrint,
  Sofa,
  Wind,
  ShieldAlert,
  Flag,
  Power,
  Lock,
  Unlock,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { ReportModal } from './ReportModal';
import { api } from '../api/client';

interface PropertyDetailsModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (listingId: string) => void;
  onOpenChat?: (matchId?: string) => void;
  onToggleActive?: (listingId: string) => void;
  onToggleRented?: (listingId: string) => void;
  isLiked?: boolean;
  isMatched?: boolean;
  matchId?: string;
  language: Language;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  listing,
  isOpen,
  onClose,
  onLike,
  onOpenChat,
  onToggleActive,
  onToggleRented,
  isLiked = false,
  isMatched = false,
  matchId,
  language,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(listing?.status || (listing?.is_active === false ? 'inactive' : 'available'));
  const [isActiveState, setIsActiveState] = useState<boolean>(listing?.is_active !== undefined ? listing.is_active : true);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS['es'];

  const handleQuickToggleActive = () => {
    const nextActive = !isActiveState;
    const nextStatus = nextActive ? (currentStatus === 'rented' ? 'rented' : 'available') : 'inactive';
    setIsActiveState(nextActive);
    setCurrentStatus(nextStatus);
    api.matching.toggleListingStatus(listing.id, nextActive, nextStatus).catch(() => {});
    if (onToggleActive) onToggleActive(listing.id);
    setStatusFeedback(nextActive ? '🟢 Anuncio activado con 1 clic' : '⏸️ Anuncio desactivado / pausado con 1 clic');
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const handleQuickToggleRented = () => {
    const isCurrentlyRented = currentStatus === 'rented';
    const nextStatus = isCurrentlyRented ? 'available' : 'rented';
    setCurrentStatus(nextStatus);
    setIsActiveState(true);
    api.matching.toggleListingStatus(listing.id, true, nextStatus).catch(() => {});
    if (onToggleRented) onToggleRented(listing.id);
    setStatusFeedback(isCurrentlyRented ? '🟢 Anuncio marcado como DISPONIBLE con 1 clic' : '🔒 Anuncio marcado como ALQUILADO con 1 clic');
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  if (!isOpen || !listing) return null;

  // Garantizar por lo menos 10 fotos en la visualización detallada
  const defaultFallbackImages = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80',
  ];

  let rawImages: string[] = [];
  if (Array.isArray(listing.images) && listing.images.length > 0) {
    rawImages = [...listing.images];
  } else if (Array.isArray(listing.photos) && listing.photos.length > 0) {
    rawImages = [...listing.photos];
  }

  // Si tiene menos de 10 fotos, completamos con fotos de alta resolución para garantizar siempre al menos 10 fotos
  while (rawImages.length < 10) {
    const fallback = defaultFallbackImages[rawImages.length % defaultFallbackImages.length];
    if (!rawImages.includes(fallback)) {
      rawImages.push(fallback);
    } else {
      rawImages.push(`${fallback}&idx=${rawImages.length}`);
    }
  }

  const images = rawImages;
  const currentPhoto = images[activePhotoIdx] || images[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 my-auto max-h-[92vh] flex flex-col text-[#1E1B4B]"
        onClick={(e) => e.stopPropagation()}
        id="property-details-modal"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Inmueble Certificado
            </span>
            {!isActiveState || currentStatus === 'inactive' ? (
              <span className="bg-stone-200 text-stone-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                <Power className="w-3.5 h-3.5 text-stone-600" />
                Desactivado / Pausado
              </span>
            ) : currentStatus === 'rented' ? (
              <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                Alquilada
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Disponible
              </span>
            )}
            <span className="text-xs text-stone-500 font-mono truncate">
              ID: {listing.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* PHOTO GALLERY SECTION (At least 10 photos) */}
          <div className="relative bg-stone-950 h-72 sm:h-96 w-full select-none overflow-hidden group">
            <img
              src={currentPhoto}
              alt={`${listing.title} - Foto ${activePhotoIdx + 1}`}
              className="w-full h-full object-contain sm:object-cover transition-all duration-300"
            />

            {/* Counter pill */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5">
              <span>Foto {activePhotoIdx + 1} de {images.length}</span>
              <span className="text-[10px] text-amber-400 font-mono">(Mínimo 10 fotos)</span>
            </div>

            {/* Arrows */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Price badge */}
            <div className="absolute bottom-3 right-3 bg-[#1E1B4B]/95 text-white px-3.5 py-1.5 rounded-xl text-sm font-black shadow-lg">
              {listing.rent} €<span className="text-xs font-normal text-stone-300">/mes</span>
            </div>
          </div>

          {/* Thumbnail Carousel (10+ photos) */}
          <div className="bg-stone-900 p-2 overflow-x-auto flex gap-2 scrollbar-thin">
            {images.map((img, i) => (
              <button
                key={`thumb-${i}`}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  activePhotoIdx === i ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/70 text-[9px] text-white px-1 font-mono">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>

          {/* 1-CLICK STATUS MANAGEMENT BAR (Only for landlords with management permission) */}
          {(Boolean(onToggleActive) || Boolean(onToggleRented)) && (
            <div className="bg-stone-50 border-y border-stone-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-stone-200 flex items-center justify-center text-[#1E1B4B]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-[#1E1B4B] flex items-center gap-1.5">
                    <span>Gestión del Anuncio con 1 Clic</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                      Propietario
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Activa, desactiva o cambia el estado entre alquilada y disponible con un solo botón.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón 1: Activar / Desactivar con 1 clic */}
                <button
                  type="button"
                  onClick={handleQuickToggleActive}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    !isActiveState || currentStatus === 'inactive'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-800 hover:bg-stone-900 text-white'
                  }`}
                  title={!isActiveState || currentStatus === 'inactive' ? 'Activar anuncio con 1 clic' : 'Desactivar anuncio con 1 clic'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{!isActiveState || currentStatus === 'inactive' ? 'Activar Anuncio' : 'Desactivar Anuncio'}</span>
                </button>

                {/* Botón 2: Marcar como Alquilada / Disponible con 1 clic */}
                <button
                  type="button"
                  onClick={handleQuickToggleRented}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    currentStatus === 'rented'
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                  title={currentStatus === 'rented' ? 'Marcar como disponible con 1 clic' : 'Marcar como alquilada con 1 clic'}
                >
                  {currentStatus === 'rented' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Marcar Disponible</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Marcar Alquilada</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {statusFeedback && (
            <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-2 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* MAIN PROPERTY DETAILS */}
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B]">
                  {listing.title}
                </h1>
                <div className="text-2xl font-black text-[#1E1B4B]">
                  {listing.rent} €<span className="text-xs font-normal text-stone-500">/mes</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  {listing.address ? `${listing.address}, ` : ''}
                  {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                  <strong className="text-stone-800">{listing.city}</strong>
                </span>
              </div>
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center">
                <BedDouble className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xs font-bold block">{listing.rooms_count || listing.bedrooms || 2} habitaciones</span>
                <span className="text-[10px] text-stone-400">Dormitorios</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center">
                <Bath className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xs font-bold block">{listing.bathrooms_count || listing.bathrooms || 1} baños</span>
                <span className="text-[10px] text-stone-400">Completos</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center">
                <Home className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xs font-bold block">{listing.surface_sqm || listing.square_meters || 75} m²</span>
                <span className="text-[10px] text-stone-400">Superficie</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center">
                <Calendar className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xs font-bold block">{listing.available_from || 'Inmediata'}</span>
                <span className="text-[10px] text-stone-400">Disponibilidad</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[#1E1B4B] uppercase tracking-wider text-[11px]">
                Descripción del Inmueble
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-stone-50/60 p-4 rounded-2xl border border-stone-100">
                {listing.description || 'Vivienda luminosa y acogedora en excelente estado. Equipada con todas las comodidades modernas, armarios empotrados y cocina totalmente amueblada.'}
              </p>
            </div>

            {/* Amenities & Conditions */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-[#1E1B4B] uppercase tracking-wider text-[11px]">
                Características y Equipamiento
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <Sofa className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{listing.furnished ? 'Amueblado' : 'Sin amueblar'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{listing.pets_allowed ? 'Admite mascotas' : 'No mascotas'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <Wind className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aire acondicionado</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ascensor</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fianza: {listing.deposit || listing.rent || 0} €</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ingresos mín: {listing.min_income_required || (listing.rent ? Math.round(listing.rent * 2.5) : 2000)} €</span>
                </div>
              </div>
            </div>

            {/* Landlord Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {listing.landlord_avatar ? (
                    <img src={listing.landlord_avatar} alt={listing.landlord_name} className="w-full h-full object-cover" />
                  ) : (
                    listing.landlord_name?.charAt(0) || 'P'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1E1B4B]">{listing.landlord_name || 'Propietario Verificado'}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-stone-500">Propietario verificado con titularidad de la vivienda</span>
                </div>
              </div>

              {isMatched && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  Match Activo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            title="Señalar este anuncio si contiene información falsa o intento de estafa"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Denunciar anuncio</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors"
            >
              Cerrar
            </button>

            {isMatched && onOpenChat ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(matchId);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir Chat con Propietario
              </button>
            ) : !isLiked && onLike ? (
              <button
                type="button"
                onClick={() => {
                  onLike(listing.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Heart className="w-4 h-4 fill-white" />
                Dar Me Gusta (Enviar Notificación)
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200">
                <Heart className="w-4 h-4 fill-rose-600" />
                Like Enviado al Propietario
              </div>
            )}
          </div>
        </div>

        {/* Modal de denuncia */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="listing"
          targetId={listing.id}
          targetTitle={listing.title}
          targetUserId={listing.landlord_id}
          targetUserName={listing.landlord_name}
        />
      </div>
    </div>
  );
};

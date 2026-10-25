import React, { useState } from 'react';
import { X, Building2, Euro, CheckCircle2, MapPin, Navigation, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { detectOrActivateLocation, SPANISH_CITIES_CATALOG } from '../lib/locationService';

export const ANDALUSIA_CITIES = [
  'Málaga',
  'Sevilla',
  'Granada',
  'Córdoba',
  'Cádiz',
  'Almería',
  'Huelva',
  'Jaén',
] as const;

interface CreateListingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onListingCreated: () => void;
  currentUserEmail?: string;
  currentUserId?: string;
  language: Language;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  currentUserEmail,
  currentUserId,
  language
}) => {
  if (isOpen !== undefined && !isOpen) return null;
  const t = TRANSLATIONS[language];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultSampleImages = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
  ];

  const [images, setImages] = useState<string[]>(defaultSampleImages);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [ownershipDocUrl, setOwnershipDocUrl] = useState('');
  const [cadastralRef, setCadastralRef] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: 'Málaga',
    neighborhood: 'Centro / Soho',
    address: '',
    address_exact: '',
    latitude: 36.7213,
    longitude: -4.4214,
    rent: 850,
    deposit: 850,
    currency: '€',
    property_type: 'apartment',
    rental_duration_type: 'long_term' as 'long_term' | 'short_stay',
    duration_unit: 'months' as 'months' | 'years' | 'indefinite',
    duration_value: 12,
    available_from: new Date().toISOString().split('T')[0],
    available_until: '',
    is_indefinite: false,
    is_scheduled: false,
    scheduled_publish_at: '',
    rooms_count: 2,
    bathrooms_count: 1,
    surface_sqm: 55,
    pets_allowed: true,
    furnished: true,
    min_income_required: 2100,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  const handleAutoLocate = async () => {
    setIsLocating(true);
    setLocationFeedback(null);
    try {
      const res = await detectOrActivateLocation();
      setFormData(prev => ({
        ...prev,
        city: res.city,
        latitude: res.lat,
        longitude: res.lng,
      }));
      setLocationFeedback(`📍 Ubicación activada: ${res.city}`);
      setTimeout(() => setLocationFeedback(null), 3000);
    } catch {
      setLocationFeedback('Selecciona una ciudad de la lista');
      setTimeout(() => setLocationFeedback(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (images.length < 10) {
      setError(`Se requiere un mínimo de 10 fotografías (actualmente: ${images.length}).`);
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description || null,
        city: formData.city,
        neighborhood: formData.neighborhood || null,
        address: formData.address || null,
        address_exact: formData.address_exact || null,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        rent: Number(formData.rent),
        deposit: Number(formData.deposit),
        currency: formData.currency,
        property_type: formData.property_type,
        rental_duration_type: formData.rental_duration_type,
        duration_unit: formData.duration_unit,
        duration_value: Number(formData.duration_value) || 12,
        available_from: formData.available_from,
        available_until: formData.is_indefinite ? null : (formData.available_until || null),
        is_indefinite: formData.is_indefinite,
        is_scheduled: formData.is_scheduled,
        scheduled_publish_at: formData.is_scheduled ? formData.scheduled_publish_at : null,
        publishing_status: formData.is_scheduled ? 'scheduled' : 'published',
        rooms_count: Number(formData.rooms_count),
        bathrooms_count: Number(formData.bathrooms_count),
        surface_sqm: Number(formData.surface_sqm),
        pets_allowed: formData.pets_allowed,
        furnished: formData.furnished,
        min_income_required: Number(formData.min_income_required),
        images: images,
        ownership_document_url: ownershipDocUrl.trim() || null,
        cadastral_reference: cadastralRef.trim() || null,
      };

      if (currentUserId) {
        payload.landlord_id = currentUserId;
      }

      await api.matching.createListing(payload);
      setSuccess(true);
      setTimeout(() => {
        onListingCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('Seuls les propriétaires') || errMsg.includes('landlord') || errMsg.includes('interdite')) {
        setError(t.createListingLandlordOnlyError);
      } else {
        setError(errMsg || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F6] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 text-[#1E1B4B] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1E1B4B]" />
            <h3 className="text-base font-bold text-[#1E1B4B]">{t.publishModalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-[#1E1B4B]">{t.publishSuccessTitle}</h4>
            <p className="text-xs text-stone-500">{t.publishSuccessDesc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-700 mb-1">{t.listingTitleLabel}</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={t.listingTitlePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            {/* 1-Click Auto Location Detection */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block leading-tight">Activar ubicación del inmueble</span>
                  <span className="text-[10px] text-stone-500">Detecta ciudad y coordenadas automáticamente</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                id="btn-create-listing-auto-locate"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    <span>Detectando...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>Activar ahora</span>
                  </>
                )}
              </button>
            </div>

            {locationFeedback && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                {locationFeedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.cityLabel} (España)</label>
                <select
                  required
                  value={formData.city}
                  onChange={e => {
                    const chosen = SPANISH_CITIES_CATALOG.find(c => c.name === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      city: e.target.value,
                      latitude: chosen?.lat ?? prev.latitude,
                      longitude: chosen?.lng ?? prev.longitude,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                >
                  {SPANISH_CITIES_CATALOG.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.province})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.neighborhoodLabel}</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder={t.neighborhoodPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.rentLabel}</label>
                <input
                  type="number"
                  required
                  value={formData.rent}
                  onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.surface} (m²)</label>
                <input
                  type="number"
                  value={formData.surface_sqm}
                  onChange={e => setFormData({ ...formData, surface_sqm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.roomsCount}</label>
                <input
                  type="number"
                  value={formData.rooms_count}
                  onChange={e => setFormData({ ...formData, rooms_count: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
            </div>

            {/* Tipo de Propiedad / Inmueble */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Tipo de Propiedad / Inmueble</label>
              <select
                value={formData.property_type}
                onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B] text-xs font-semibold"
              >
                <option value="apartment">Piso / Apartamento</option>
                <option value="studio">Estudio</option>
                <option value="house">Casa / Chalet</option>
                <option value="room">Habitación</option>
                <option value="penthouse">Ático / Dúplex</option>
              </select>
            </div>

            {/* Duración y Fechas del Alquiler */}
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>🗓️ Modalidad y Duración del Alquiler</span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {formData.rental_duration_type === 'long_term' ? 'Larga Duración' : 'Corta / Media Estancia'}
                </span>
              </div>

              {/* Selector de Larga Duración vs Corta Estancia */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rental_duration_type: 'long_term' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                    formData.rental_duration_type === 'long_term'
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  🏠 Larga Duración
                  <span className="block text-[10px] font-normal opacity-80">Vivienda habitual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rental_duration_type: 'short_stay' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                    formData.rental_duration_type === 'short_stay'
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  ⚡ Corta Estancia
                  <span className="block text-[10px] font-normal opacity-80">Temporal / Seasonal</span>
                </button>
              </div>

              {/* Unidad y valor de duración */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 mb-1">Medida</label>
                  <select
                    value={formData.duration_unit}
                    onChange={e => {
                      const unit = e.target.value as 'months' | 'years' | 'indefinite';
                      setFormData(prev => ({
                        ...prev,
                        duration_unit: unit,
                        is_indefinite: unit === 'indefinite',
                        duration_value: unit === 'years' ? 1 : unit === 'months' ? 12 : 0,
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  >
                    <option value="months">Meses</option>
                    <option value="years">Años</option>
                    <option value="indefinite">Indefinido</option>
                  </select>
                </div>

                {formData.duration_unit !== 'indefinite' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-stone-700 mb-1">
                      Cantidad de {formData.duration_unit === 'years' ? 'Años' : 'Meses'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formData.duration_unit === 'years' ? 15 : 60}
                      value={formData.duration_value}
                      onChange={e => setFormData(prev => ({ ...prev, duration_value: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                    />
                  </div>
                )}
              </div>

              {/* Fechas: A partir de cuándo & Hasta cuándo */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 mb-1">
                    A partir de cuándo (Inicio)
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.available_from}
                    onChange={e => setFormData(prev => ({ ...prev, available_from: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 mb-1">
                    Hasta cuándo (Fin)
                  </label>
                  <input
                    type="date"
                    disabled={formData.is_indefinite}
                    value={formData.is_indefinite ? '' : formData.available_until}
                    onChange={e => setFormData(prev => ({ ...prev, available_until: e.target.value }))}
                    placeholder="Sin fecha fin"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B] disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={formData.is_indefinite}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    is_indefinite: e.target.checked,
                    duration_unit: e.target.checked ? 'indefinite' : 'months',
                    available_until: e.target.checked ? '' : prev.available_until
                  }))}
                  className="rounded border-stone-300 text-[#1E1B4B]"
                />
                <span className="text-[11px] font-semibold text-stone-700">
                  Alquiler indefinido (sin fecha límite de salida fijada)
                </span>
              </label>
            </div>

            {/* Programación del Anuncio */}
            <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-sky-950">
                  <input
                    type="checkbox"
                    checked={formData.is_scheduled}
                    onChange={e => setFormData(prev => ({ ...prev, is_scheduled: e.target.checked }))}
                    className="rounded border-sky-300 text-[#1E1B4B]"
                  />
                  <span>🕒 Programar publicación del anuncio</span>
                </label>
                {formData.is_scheduled && (
                  <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded">
                    Programado
                  </span>
                )}
              </div>
              {formData.is_scheduled && (
                <div className="space-y-1 animate-fade-in pt-1">
                  <label className="block text-[11px] font-semibold text-sky-900">
                    Fecha y hora exacta en la que se publicará el anuncio:
                  </label>
                  <input
                    type="datetime-local"
                    required={formData.is_scheduled}
                    value={formData.scheduled_publish_at}
                    onChange={e => setFormData(prev => ({ ...prev, scheduled_publish_at: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-sky-300 focus:outline-none focus:border-[#1E1B4B]"
                  />
                  <p className="text-[10px] text-sky-700">
                    El anuncio se guardará en tu catálogo y se activará automáticamente para los inquilinos cuando llegue la fecha programada.
                  </p>
                </div>
              )}
            </div>

            {/* Fotos obligatorias (mínimo 10) */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-stone-700">
                  Fotos del inmueble ({images.length}/10 mínimo requeridas)
                </label>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${images.length >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {images.length >= 10 ? '✓ Requisito cumplido' : `Faltan ${10 - images.length}`}
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="Pegar URL de foto (ej. https://...)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-1.5 bg-[#1E1B4B] text-white rounded-xl font-bold hover:bg-[#28235C] transition-colors"
                >
                  + Añadir
                </button>
              </div>

              {/* Miniaturas */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 max-h-36 overflow-y-auto">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-stone-200 aspect-square">
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-[9px] text-white px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verificación de Titularidad (P1.6) */}
            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-950">Verificación de Titularidad (Escritura / Nota Simple)</span>
              </div>
              <p className="text-[11px] text-indigo-900/80">
                Aporta la referencia catastral o enlace a la Nota Simple para recibir el distintivo de <strong>Inmueble Verificado</strong>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">Ref. Catastral</label>
                  <input
                    type="text"
                    value={cadastralRef}
                    onChange={e => setCadastralRef(e.target.value)}
                    placeholder="20 caracteres alfanuméricos"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">URL Nota Simple / Documento</label>
                  <input
                    type="url"
                    value={ownershipDocUrl}
                    onChange={e => setOwnershipDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
              </div>
            </div>

            {/* Dirección exacta (privada) */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Dirección exacta (Privada: solo visible tras el match)
              </label>
              <input
                type="text"
                value={formData.address_exact}
                onChange={e => setFormData({ ...formData, address_exact: e.target.value })}
                placeholder="Ej. Calle Larios 14, 3º B"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">{t.descriptionLabel}</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.furnished}
                  onChange={e => setFormData({ ...formData, furnished: e.target.checked })}
                  className="rounded border-stone-300 text-[#1E1B4B]"
                />
                <span className="font-semibold text-stone-700">{t.furnished}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pets_allowed}
                  onChange={e => setFormData({ ...formData, pets_allowed: e.target.checked })}
                  className="rounded border-stone-300 text-[#1E1B4B]"
                />
                <span className="font-semibold text-stone-700">{t.petsAllowed}</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? t.publishingBtn : t.publishListingBtn}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

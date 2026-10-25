import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  ArrowLeft, 
  Image as ImageIcon, 
  Upload, 
  MapPin, 
  Euro, 
  ShieldCheck, 
  Plus, 
  AlertCircle,
  Home,
  Navigation,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { ANDALUSIA_CITIES } from './CreateListingModal';
import { detectOrActivateLocation, SPANISH_CITIES_CATALOG } from '../lib/locationService';

interface PublishListingViewProps {
  currentUserId?: string;
  currentUserEmail?: string;
  language: Language;
  onListingCreated: () => void;
  onBackToDashboard: () => void;
}

export const PublishListingView: React.FC<PublishListingViewProps> = ({
  currentUserId,
  language,
  onListingCreated,
  onBackToDashboard,
}) => {
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
    surface_sqm: 60,
    pets_allowed: false,
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
      setFormData((prev) => ({
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
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      }, 1500);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('Seuls les propriétaires') || errMsg.includes('landlord') || errMsg.includes('interdite')) {
        setError(t.createListingLandlordOnlyError);
      } else {
        setError(errMsg || 'Ocurrió un error al publicar el anuncio.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs shrink-0">
            <Building2 className="w-6 h-6 text-[#D97706]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#1E1B4B] tracking-tight">
                {t.navLandlordPublish || 'Publicar anuncio'}
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Apartado Exclusivo
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Crea y publica un nuevo inmueble en alquiler para recibir solicitudes de inquilinos con pasaporte verificado
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Anuncios</span>
        </button>
      </div>

      {/* Main Publication Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        {success ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-[#1E1B4B]">
              {t.publishSuccessTitle}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {t.publishSuccessDesc} Tu vivienda ya está disponible en la sección de Anuncios y en el radar de inquilinos.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onListingCreated}
                className="px-5 py-2.5 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-all shadow-xs"
              >
                Ver en mis Anuncios
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Información Básica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Home className="w-4 h-4 text-[#1E1B4B]" />
                <h2 className="text-sm font-black text-[#1E1B4B] uppercase tracking-wider">
                  1. Información Principal del Inmueble
                </h2>
              </div>

              <div>
                <label className="block font-bold text-xs text-stone-800 mb-1.5">
                  {t.listingTitleLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej. Ático luminoso reformado en Soho con terraza y ascensor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
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
                  id="btn-publish-auto-locate"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    {t.cityLabel} (España) *
                  </label>
                  <select
                    required
                    value={formData.city}
                    onChange={(e) => {
                      const chosen = SPANISH_CITIES_CATALOG.find((c) => c.name === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                        latitude: chosen?.lat ?? prev.latitude,
                        longitude: chosen?.lng ?? prev.longitude,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  >
                    {SPANISH_CITIES_CATALOG.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    {t.neighborhoodLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ej. Centro / Soho / Teatinos / Triana"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    Zona o calle aproximada (Pública para inquilinos)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej. Calle Tomás Heredia, Soho"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    Dirección exacta (Privada: solo visible tras el match mutuo)
                  </label>
                  <input
                    type="text"
                    value={formData.address_exact}
                    onChange={(e) => setFormData({ ...formData, address_exact: e.target.value })}
                    placeholder="Ej. Calle Tomás Heredia 14, Planta 4ª Puerta B"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Precio y Condiciones */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Euro className="w-4 h-4 text-[#1E1B4B]" />
                <h2 className="text-sm font-black text-[#1E1B4B] uppercase tracking-wider">
                  2. Precio, Fianza y Características
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    {t.rentLabel} (€/mes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    Fianza (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    Ingresos mínimos recomendados (€/mes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.min_income_required}
                    onChange={(e) => setFormData({ ...formData, min_income_required: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    {t.surface} (m²)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={formData.surface_sqm}
                    onChange={(e) => setFormData({ ...formData, surface_sqm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    {t.roomsCount}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.rooms_count}
                    onChange={(e) => setFormData({ ...formData, rooms_count: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-stone-800 mb-1.5">
                    Número de Baños
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.bathrooms_count}
                    onChange={(e) => setFormData({ ...formData, bathrooms_count: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>

              {/* Tipo de Inmueble */}
              <div>
                <label className="block font-bold text-xs text-stone-800 mb-1.5">
                  Tipo de Propiedad / Inmueble *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                >
                  <option value="apartment">Piso / Apartamento</option>
                  <option value="studio">Estudio</option>
                  <option value="house">Casa / Chalet</option>
                  <option value="room">Habitación</option>
                  <option value="penthouse">Ático / Dúplex</option>
                </select>
              </div>

              {/* Duración y Fechas del Alquiler */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🗓️</span>
                    <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Modalidad y Duración del Alquiler
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                    {formData.rental_duration_type === 'long_term' ? 'Larga Duración' : 'Corta / Media Estancia'}
                  </span>
                </div>

                {/* Selector de Larga Duración vs Corta Estancia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rental_duration_type: 'long_term' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center border ${
                      formData.rental_duration_type === 'long_term'
                        ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    🏠 Larga Duración
                    <span className="block text-[11px] font-normal opacity-85 mt-0.5">
                      Vivienda habitual residencial
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rental_duration_type: 'short_stay' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center border ${
                      formData.rental_duration_type === 'short_stay'
                        ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    ⚡ Corta / Media Estancia
                    <span className="block text-[11px] font-normal opacity-85 mt-0.5">
                      Temporal, estudiantes, nómadas
                    </span>
                  </button>
                </div>

                {/* Unidad y valor de duración */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Unidad de tiempo
                    </label>
                    <select
                      value={formData.duration_unit}
                      onChange={(e) => {
                        const unit = e.target.value as 'months' | 'years' | 'indefinite';
                        setFormData((prev) => ({
                          ...prev,
                          duration_unit: unit,
                          is_indefinite: unit === 'indefinite',
                          duration_value: unit === 'years' ? 1 : unit === 'months' ? 12 : 0,
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                    >
                      <option value="months">Meses</option>
                      <option value="years">Años</option>
                      <option value="indefinite">Indefinido</option>
                    </select>
                  </div>

                  {formData.duration_unit !== 'indefinite' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Cantidad de {formData.duration_unit === 'years' ? 'Años' : 'Meses'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={formData.duration_unit === 'years' ? 15 : 60}
                        value={formData.duration_value}
                        onChange={(e) => setFormData((prev) => ({ ...prev, duration_value: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                      />
                    </div>
                  )}
                </div>

                {/* Fechas: A partir de cuándo & Hasta cuándo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      A partir de cuándo (Fecha de inicio) *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.available_from}
                      onChange={(e) => setFormData((prev) => ({ ...prev, available_from: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Hasta cuándo (Fecha de finalización)
                    </label>
                    <input
                      type="date"
                      disabled={formData.is_indefinite}
                      value={formData.is_indefinite ? '' : formData.available_until}
                      onChange={(e) => setFormData((prev) => ({ ...prev, available_until: e.target.value }))}
                      placeholder="Sin fecha fin"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] disabled:bg-stone-100 disabled:text-stone-400"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.is_indefinite}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      is_indefinite: e.target.checked,
                      duration_unit: e.target.checked ? 'indefinite' : 'months',
                      available_until: e.target.checked ? '' : prev.available_until,
                    }))}
                    className="rounded border-stone-300 text-[#1E1B4B] w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Alquiler de duración indefinida (sin fecha límite de salida fijada)
                  </span>
                </label>
              </div>

              {/* Programación del Anuncio */}
              <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-sky-950">
                    <input
                      type="checkbox"
                      checked={formData.is_scheduled}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_scheduled: e.target.checked }))}
                      className="rounded border-sky-300 text-[#1E1B4B] w-4 h-4"
                    />
                    <span>🕒 Programar publicación del anuncio</span>
                  </label>
                  {formData.is_scheduled && (
                    <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2.5 py-0.5 rounded-full">
                      Programación activa
                    </span>
                  )}
                </div>
                {formData.is_scheduled && (
                  <div className="space-y-1.5 animate-fade-in pt-1">
                    <label className="block text-xs font-semibold text-sky-950">
                      Fecha y hora exacta en la que se publicará el anuncio automáticamente:
                    </label>
                    <input
                      type="datetime-local"
                      required={formData.is_scheduled}
                      value={formData.scheduled_publish_at}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_publish_at: e.target.value }))}
                      className="w-full sm:w-auto min-w-[280px] px-3 py-2 text-xs rounded-xl bg-white border border-sky-300 focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                    />
                    <p className="text-[11px] text-sky-800 leading-relaxed">
                      El anuncio se guardará en tu panel de control y se pondrá en estado visible para los inquilinos cuando llegue la fecha programada.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.furnished}
                    onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                    className="rounded border-stone-300 text-[#1E1B4B] w-4 h-4"
                  />
                  <span>{t.furnished}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.pets_allowed}
                    onChange={(e) => setFormData({ ...formData, pets_allowed: e.target.checked })}
                    className="rounded border-stone-300 text-[#1E1B4B] w-4 h-4"
                  />
                  <span>{t.petsAllowed}</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-xs text-stone-800 mb-1.5">
                  {t.descriptionLabel}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
            </div>

            {/* Section 3: Fotografías (Mínimo 10 Obligatorio) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#1E1B4B]" />
                  <h2 className="text-sm font-black text-[#1E1B4B] uppercase tracking-wider">
                    3. Fotografías del Inmueble (Mínimo 10 Requeridas)
                  </h2>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    images.length >= 10
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {images.length >= 10
                    ? `✓ ${images.length} fotos cargadas`
                    : `Faltan ${10 - images.length} fotos`}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Pegar URL de foto adicional (ej. https://images.unsplash.com/...)"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors"
                >
                  + Añadir foto
                </button>
              </div>

              {/* Grid de miniaturas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-100 shadow-2xs"
                  >
                    <img
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                      Foto #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Verificación Acreditada de Titularidad */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
                <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                  4. Verificación de Titularidad (Opcional - Check Inmueble Verificado)
                </h3>
              </div>
              <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                Indica la referencia catastral o enlace a la Nota Simple para que el equipo certifique tu propiedad. Los anuncios certificados generan hasta 4 veces más confianza entre los inquilinos solventes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Referencia Catastral (20 caracteres)
                  </label>
                  <input
                    type="text"
                    value={cadastralRef}
                    onChange={(e) => setCadastralRef(e.target.value)}
                    placeholder="Ej. 9872023VH5797S0001WX"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    URL Documento / Nota Simple
                  </label>
                  <input
                    type="url"
                    value={ownershipDocUrl}
                    onChange={(e) => setOwnershipDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
              </div>
            </div>

            {/* Botón Principal de Publicación */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBackToDashboard}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 transition-colors"
              >
                Cancelar y Volver
              </button>

              <button
                type="submit"
                disabled={loading || images.length < 10}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-submit-publish-listing"
              >
                {loading ? (
                  <span>Publicando vivienda en Rentia...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#D97706]" />
                    <span>{t.createFirstListingBtn || 'Crear mi primer anuncio'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

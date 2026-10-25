import React, { useState, useMemo } from 'react';
import { 
  User, 
  Home, 
  Euro, 
  MapPin, 
  Sparkles, 
  Heart, 
  Briefcase, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Footprints, 
  Bike, 
  Bus, 
  Car, 
  ShieldCheck, 
  Dog, 
  Users,
  Flame,
  ThumbsUp,
  Meh,
  ThumbsDown,
  Building,
  BedDouble,
  Building2,
  Calendar,
  Layers,
  Navigation,
  Loader2,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { api } from '../api/client';
import { TenantProfile } from '../types';
import { useTenantPhotoRequirement, SAMPLE_TENANT_PHOTOS } from '../hooks/useTenantPhotoRequirement';
import { detectOrActivateLocation, SPANISH_CITIES_CATALOG } from '../lib/locationService';
import { LocationPickerModal } from './LocationPickerModal';

interface TenantGamifiedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    email?: string;
    name?: string;
  };
  currentTenant?: TenantProfile;
  onSaved?: (updatedTenant: any) => void;
}

const AMENITIES_LIST = [
  { id: 'terraza', label: 'Terraza', icon: '☀️' },
  { id: 'balcon', label: 'Balcón', icon: '🪟' },
  { id: 'ascensor', label: 'Ascensor', icon: '🛗' },
  { id: 'garaje', label: 'Garaje', icon: '🚗' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'piscina', label: 'Piscina', icon: '🏊' },
  { id: 'jardin', label: 'Jardín', icon: '🌿' },
  { id: 'aire_acondicionado', label: 'Aire acondicionado', icon: '❄️' },
  { id: 'calefaccion', label: 'Calefacción', icon: '🔥' },
  { id: 'amueblado', label: 'Amueblado', icon: '🛋️' },
  { id: 'cocina_equipada', label: 'Cocina equipada', icon: '🍳' },
  { id: 'lavadora', label: 'Lavadora', icon: '🧺' },
  { id: 'lavavajillas', label: 'Lavavajillas', icon: '🍽️' },
  { id: 'exterior', label: 'Exterior', icon: '🏙️' },
  { id: 'luminoso', label: 'Luminoso', icon: '💡' },
  { id: 'vistas', label: 'Vistas panorámicas', icon: '🌄' },
  { id: 'armarios', label: 'Armarios empotrados', icon: '🚪' },
  { id: 'trastero', label: 'Trastero', icon: '📦' },
  { id: 'espacio_teletrabajar', label: 'Espacio teletrabajo', icon: '💻' },
];

export const TenantGamifiedOnboardingModal: React.FC<TenantGamifiedOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTenant,
  onSaved,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  // 1. Identificación y Unidad de Convivencia
  const [fullName, setFullName] = useState<string>(currentTenant?.fullName || currentUser.name || '');
  const [age, setAge] = useState<number | string>(currentTenant?.age || 28);
  const [phone, setPhone] = useState<string>(currentTenant?.phone || '+34 612 345 678');
  const [email, setEmail] = useState<string>(currentTenant?.email || currentUser.email || '');

  const initialTenantPhotos = useMemo(() => {
    if (currentTenant?.photos && currentTenant.photos.length > 0) {
      return currentTenant.photos;
    }
    if (currentTenant?.avatarUrl) {
      return [currentTenant.avatarUrl, SAMPLE_TENANT_PHOTOS[0], SAMPLE_TENANT_PHOTOS[1]];
    }
    return [SAMPLE_TENANT_PHOTOS[0], SAMPLE_TENANT_PHOTOS[1], SAMPLE_TENANT_PHOTOS[2]];
  }, [currentTenant]);

  const {
    photos,
    photoCount,
    isSatisfied: hasMinPhotos,
    remainingNeeded: photosRemaining,
    validationErrorMessage: photoValidationErrorMessage,
    addPhoto,
    removePhoto: handleRemovePhoto,
    addSamplePhotos,
    setPhotos,
  } = useTenantPhotoRequirement(initialTenantPhotos);

  const [photoInputUrl, setPhotoInputUrl] = useState<string>('');
  const [householdType, setHouseholdType] = useState<'solo' | 'couple' | 'family' | 'flatmates'>(
    currentTenant?.householdType || 'solo'
  );
  const [occupantsCount, setOccupantsCount] = useState<number>(currentTenant?.occupantsCount || 1);
  const [hasMinors, setHasMinors] = useState<boolean>(currentTenant?.hasMinors ?? false);
  const [hasPets, setHasPets] = useState<boolean>(currentTenant?.hasPets ?? false);
  const [petType, setPetType] = useState<string>(currentTenant?.petType || 'perro');
  const [petsCount, setPetsCount] = useState<number>(currentTenant?.petsCount || 1);

  // 2. ¿Qué vivienda busca?
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    currentTenant?.propertyTypes && currentTenant.propertyTypes.length > 0
      ? currentTenant.propertyTypes
      : ['piso']
  );
  const [searchPurpose, setSearchPurpose] = useState<string>(
    currentTenant?.searchPurpose || 'habitual'
  );
  const [desiredRooms, setDesiredRooms] = useState<string>(currentTenant?.desiredRooms || '2');
  const [desiredBathrooms, setDesiredBathrooms] = useState<string>(currentTenant?.desiredBathrooms || '1');

  // 3. Presupuesto
  const [minBudget, setMinBudget] = useState<number>(currentTenant?.minBudget || 600);
  const [maxBudget, setMaxBudget] = useState<number>(currentTenant?.maxBudget || 1000);
  const [stretchBudget, setStretchBudget] = useState<number>(currentTenant?.stretchBudget || 1100);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<{
    community: boolean;
    water: boolean;
    electricity: boolean;
    internet: boolean;
  }>({
    community: currentTenant?.utilitiesIncluded?.community ?? true,
    water: currentTenant?.utilitiesIncluded?.water ?? false,
    electricity: currentTenant?.utilitiesIncluded?.electricity ?? false,
    internet: currentTenant?.utilitiesIncluded?.internet ?? false,
  });

  // 4. Ubicación y movilidad
  const [targetCity, setTargetCity] = useState<string>(currentTenant?.targetCity || 'Málaga');
  const [customPolygon, setCustomPolygon] = useState<[number, number][]>(
    currentTenant?.customPolygon || []
  );
  const [isDrawZoneModalOpen, setIsDrawZoneModalOpen] = useState<boolean>(false);
  const [isLocatingCity, setIsLocatingCity] = useState<boolean>(false);
  const [cityFeedback, setCityFeedback] = useState<string | null>(null);
  const [targetNeighborhoods, setTargetNeighborhoods] = useState<string>(
    currentTenant?.targetNeighborhoods?.join(', ') || 'Centro, Soho, Teatinos'
  );
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(currentTenant?.searchRadiusKm || 15);
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState<number | string>(
    currentTenant?.maxCommuteMinutes || 30
  );
  const [transportMode, setTransportMode] = useState<'walking' | 'bike' | 'public' | 'car' | 'moto'>(
    currentTenant?.transportMode || 'public'
  );

  const handleAutoDetectTenantCity = async () => {
    setIsLocatingCity(true);
    setCityFeedback(null);
    try {
      const res = await detectOrActivateLocation();
      setTargetCity(res.city);
      setCityFeedback(`📍 Ubicación activada: ${res.city}`);
      setTimeout(() => setCityFeedback(null), 3000);
    } catch {
      setCityFeedback('Selecciona una ciudad de la lista');
      setTimeout(() => setCityFeedback(null), 3000);
    } finally {
      setIsLocatingCity(false);
    }
  };

  // 5. Preferencias de vivienda (Tarjetas y Top 5 Imprescindibles)
  const [amenityPriorities, setAmenityPriorities] = useState<Record<string, 'essential' | 'like' | 'neutral' | 'dislike'>>(() => {
    if (currentTenant?.amenityPriorities) return currentTenant.amenityPriorities;
    return {
      terraza: 'essential',
      ascensor: 'essential',
      aire_acondicionado: 'essential',
      luminoso: 'like',
      cocina_equipada: 'like',
    };
  });
  const [cardIndex, setCardIndex] = useState<number>(0);

  // 6. Estilo de vida
  const [smoking, setSmoking] = useState<'no' | 'yes' | 'outside'>(currentTenant?.smoking || 'no');
  const [remoteWork, setRemoteWork] = useState<'never' | 'sometimes' | 'mostly'>(
    currentTenant?.remoteWork || 'sometimes'
  );
  const [lifestyleVibe, setLifestyleVibe] = useState<'tranquil' | 'normal' | 'social'>(
    currentTenant?.lifestyleVibe || 'tranquil'
  );
  const [wantsRoommates, setWantsRoommates] = useState<'yes' | 'no' | 'any'>(
    currentTenant?.wantsRoommates || 'no'
  );
  // Habitación específica
  const [roomPreferences, setRoomPreferences] = useState({
    quietVibe: currentTenant?.roomPreferences?.quietVibe ?? true,
    likesGuests: currentTenant?.roomPreferences?.likesGuests ?? false,
    prefersStudents: currentTenant?.roomPreferences?.prefersStudents ?? false,
    prefersProfessionals: currentTenant?.roomPreferences?.prefersProfessionals ?? true,
    sharesBathroom: currentTenant?.roomPreferences?.sharesBathroom ?? true,
    privateRoom: currentTenant?.roomPreferences?.privateRoom ?? true,
  });

  // 7. Situación económica y duración
  const [employmentType, setEmploymentType] = useState<string>(
    currentTenant?.employmentType || 'indefinido'
  );
  const [incomeRange, setIncomeRange] = useState<string>(
    currentTenant?.incomeRange || '2.000–3.000 €'
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number>(
    currentTenant?.monthlyIncome || 2200
  );
  const [canProvideDocs, setCanProvideDocs] = useState<'yes' | 'no' | 'later'>(
    currentTenant?.canProvideDocs || 'yes'
  );
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(
    currentTenant?.hasGuarantor ?? false
  );
  const [moveInDate, setMoveInDate] = useState<string>(
    currentTenant?.moveInDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [rentalDuration, setRentalDuration] = useState<string>(
    currentTenant?.rentalDuration || 'long_term'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helpers for photos
  const handleAddPhotoUrl = () => {
    if (!photoInputUrl.trim()) return;
    addPhoto(photoInputUrl.trim());
    setPhotoInputUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddSamplePhoto = () => {
    addSamplePhotos(1);
  };

  // Top 5 essential amenities
  const essentialAmenities = Object.entries(amenityPriorities)
    .filter(([_, priority]) => priority === 'essential')
    .map(([key]) => key);

  const setAmenityPriority = (id: string, priority: 'essential' | 'like' | 'neutral' | 'dislike') => {
    if (priority === 'essential' && essentialAmenities.length >= 5 && amenityPriorities[id] !== 'essential') {
      setError('Puedes seleccionar un máximo de 5 imprescindibles.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setAmenityPriorities(prev => ({
      ...prev,
      [id]: priority,
    }));
  };

  // Validation before advancing
  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Por favor indica tu nombre completo.');
        return;
      }
      if (!age || Number(age) < 18) {
        setError('Indica una edad válida (mínimo 18 años).');
        return;
      }
      if (!hasMinPhotos) {
        setError(photoValidationErrorMessage);
        return;
      }
    } else if (step === 3) {
      if (minBudget >= maxBudget) {
        setError('El presupuesto mínimo debe ser menor que el máximo.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  // Final submission
  const handleSubmit = async () => {
    if (!hasMinPhotos) {
      setError(photoValidationErrorMessage);
      setStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      userId: currentUser.id,
      email: currentUser.email || email,
      full_name: fullName,
      name: fullName,
      age: Number(age),
      phone,
      photos,
      avatar_url: photos[0],
      household_type: householdType,
      occupants_count: occupantsCount,
      has_minors: hasMinors,
      has_pets: hasPets,
      pet_type: hasPets ? petType : undefined,
      pets_count: hasPets ? petsCount : 0,
      pet_details: hasPets ? `${petsCount} ${petType}` : undefined,
      property_types: propertyTypes,
      search_purpose: searchPurpose,
      desired_rooms: desiredRooms,
      desired_bathrooms: desiredBathrooms,
      min_budget: minBudget,
      max_budget: maxBudget,
      stretch_budget: stretchBudget,
      utilities_included: utilitiesIncluded,
      target_city: targetCity,
      target_neighborhoods: targetNeighborhoods.split(',').map(s => s.trim()).filter(Boolean),
      search_radius_km: searchRadiusKm,
      custom_polygon: customPolygon.length >= 3 ? customPolygon : undefined,
      customPolygon: customPolygon.length >= 3 ? customPolygon : undefined,
      max_commute_minutes: maxCommuteMinutes === 'any' ? undefined : Number(maxCommuteMinutes),
      transport_mode: transportMode,
      essential_amenities: essentialAmenities,
      amenity_priorities: amenityPriorities,
      smoking,
      remote_work: remoteWork,
      lifestyle_vibe: lifestyleVibe,
      wants_roommates: wantsRoommates,
      room_preferences: propertyTypes.includes('habitacion') ? roomPreferences : undefined,
      employment_type: employmentType,
      income_range: incomeRange,
      monthly_income: monthlyIncome,
      can_provide_docs: canProvideDocs,
      has_guarantor: hasGuarantor,
      desired_move_in_date: moveInDate,
      desired_contract_duration: rentalDuration,
      onboarding_completed: true,
    };

    try {
      const res = await api.tenant.updateFinancialProfile(payload as any);
      
      // Save local completed flag
      try {
        localStorage.setItem(`rentia_tenant_quiz_completed_${currentUser.id}`, 'true');
        localStorage.setItem('rentia_tenant_quiz_completed_current', 'true');
      } catch {}

      if (onSaved) {
        onSaved({
          ...payload,
          id: currentUser.id,
          fullName,
          firstName: fullName.split(' ')[0],
          avatarUrl: photos[0],
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving tenant profile:', err);
      setError(err.message || 'Error al guardar el perfil de matching.');
    } finally {
      setLoading(false);
    }
  };

  // Progress and match boost calculation
  const progressPercent = Math.round((step / totalSteps) * 100);
  const matchPotential = Math.min(99, 45 + step * 8);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF9F6] w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header with Gamification Bar */}
        <div className="p-5 bg-gradient-to-r from-[#1E1B4B] via-[#2A2468] to-[#1E1B4B] text-white relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Matching Inteligente de Inquilino
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                    Paso {step} de {totalSteps}
                  </span>
                </h2>
                <p className="text-xs text-stone-300">
                  Completa tu perfil para recibir propuestas personalizadas con compatibilidad algorítmica.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar & Match Score */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-300 font-medium">Progreso del test: {progressPercent}%</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Potencial de Match: {matchPotential}%
              </span>
            </div>
            <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Lo mínimo para identificar quién busca */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D97706]" />
                  1. Lo mínimo para identificar quién busca
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tus datos esenciales y fotografías. <strong>Obligatorio: mínimo 3 fotos para verificar tu perfil.</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Sofía Valenzuela"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E1B4B] focus:border-[#1E1B4B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Edad *</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E1B4B] focus:border-[#1E1B4B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E1B4B] focus:border-[#1E1B4B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1E1B4B] focus:border-[#1E1B4B] bg-white"
                  />
                </div>
              </div>

              {/* FOTOGRAFÍAS OBLIGATORIAS: MÍNIMO 3 FOTOS */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-700" />
                      Fotografías del inquilino (Obligatorio: Mínimo 3 fotos)
                    </label>
                    <p className="text-[11px] text-stone-600">
                      Los propietarios priorizan perfiles verificados con fotos reales.
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    hasMinPhotos ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {hasMinPhotos ? `✓ ${photoCount} fotos listas` : `Faltan ${photosRemaining} fotos`}
                  </span>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-stone-300 bg-stone-100 shadow-2xs">
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                        {idx === 0 ? 'Perfil' : `#${idx + 1}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Photo Button */}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-amber-400 bg-white hover:bg-amber-50 cursor-pointer flex flex-col items-center justify-center text-amber-800 transition-colors p-2 text-center">
                    <Plus className="w-5 h-5 mb-0.5 text-amber-600" />
                    <span className="text-[10px] font-bold">Subir foto</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Photo URL or Quick Fill */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="url"
                      placeholder="O pega aquí una URL de foto..."
                      value={photoInputUrl}
                      onChange={(e) => setPhotoInputUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className="px-3 py-1.5 bg-[#1E1B4B] text-white text-xs font-semibold rounded-lg hover:bg-[#28235C]"
                    >
                      Añadir
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSamplePhoto}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir foto de muestra
                  </button>
                </div>
              </div>

              {/* ¿Una persona o varias? */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">¿Una persona o varias?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'solo', label: 'Solo/a', desc: '1 persona' },
                    { id: 'couple', label: 'Pareja', desc: '2 personas' },
                    { id: 'family', label: 'Familia', desc: 'Adultos + menores' },
                    { id: 'flatmates', label: 'Compartir piso', desc: 'Compañeros' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setHouseholdType(item.id as any);
                        if (item.id === 'solo') setOccupantsCount(1);
                        else if (item.id === 'couple') setOccupantsCount(2);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        householdType === item.id
                          ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className={`text-[10px] ${householdType === item.id ? 'text-stone-300' : 'text-stone-400'}`}>
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Número de personas y menores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Número total de personas que vivirán:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOccupantsCount(prev => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-xl border border-stone-300 bg-white font-bold text-stone-700 flex items-center justify-center hover:bg-stone-50"
                    >
                      -
                    </button>
                    <span className="text-base font-bold text-[#1E1B4B] w-8 text-center">{occupantsCount}</span>
                    <button
                      type="button"
                      onClick={() => setOccupantsCount(prev => prev + 1)}
                      className="w-9 h-9 rounded-xl border border-stone-300 bg-white font-bold text-stone-700 flex items-center justify-center hover:bg-stone-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">¿Hay menores?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasMinors(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        !hasMinors ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasMinors(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        hasMinors ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      Sí
                    </button>
                  </div>
                </div>
              </div>

              {/* Mascotas */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">¿Tienes mascotas?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasPets(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      !hasPets ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPets(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      hasPets ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    Sí (Tengo mascota)
                  </button>
                </div>

                {hasPets && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Tipo de mascota</label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                      >
                        <option value="perro">🐶 Perro</option>
                        <option value="gato">🐱 Gato</option>
                        <option value="otro">🐾 Otro animal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Número de mascotas</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={petsCount}
                        onChange={(e) => setPetsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ¿Qué vivienda busca? */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#D97706]" />
                  2. 🏠 ¿Qué vivienda buscas?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Aquí empieza el matching algorítmico según tus preferencias espaciales.
                </p>
              </div>

              {/* Tipo de vivienda */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Tipo de vivienda (puedes marcar varios)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'piso', icon: '🏢', label: 'Piso' },
                    { id: 'casa', icon: '🏠', label: 'Casa' },
                    { id: 'chalet', icon: '🏡', label: 'Chalet' },
                    { id: 'adosado', icon: '🏘️', label: 'Adosado' },
                    { id: 'habitacion', icon: '🛏️', label: 'Habitación' },
                    { id: 'estudio', icon: '🏢', label: 'Estudio' },
                  ].map((item) => {
                    const isSelected = propertyTypes.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (propertyTypes.length > 1) {
                              setPropertyTypes(prev => prev.filter(t => t !== item.id));
                            }
                          } else {
                            setPropertyTypes(prev => [...prev, item.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="text-xl mb-1">{item.icon}</div>
                        <div className="text-xs font-bold">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ¿Para qué la busca? */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">¿Para qué la buscas?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'habitual', label: 'Vivienda habitual' },
                    { id: 'estudiantes', label: 'Estudiantes' },
                    { id: 'trabajo', label: 'Por trabajo' },
                    { id: 'pareja', label: 'Con mi pareja' },
                    { id: 'vacaciones', label: 'Vacaciones/temporal' },
                    { id: 'otro', label: 'Otro motivo' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSearchPurpose(item.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        searchPurpose === item.id
                          ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habitaciones y Baños */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Habitaciones mínimas</label>
                  <div className="flex gap-1.5">
                    {['1', '2', '3', '4+', 'any'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDesiredRooms(r)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          desiredRooms === r ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {r === 'any' ? 'Igual' : r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Baños mínimos</label>
                  <div className="flex gap-1.5">
                    {['1', '2', '3+', 'any'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setDesiredBathrooms(b)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          desiredBathrooms === b ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {b === 'any' ? 'Igual' : b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Presupuesto inteligente */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Euro className="w-5 h-5 text-[#D97706]" />
                  3. 💰 Presupuesto y Gastos
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ajusta tu rango ideal y tu presupuesto flexible si la vivienda cumple todas tus expectativas.
                </p>
              </div>

              {/* Selector de rango de precio */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  ¿Cuánto quieres pagar al mes?
                </label>
                <div className="flex items-center justify-between text-base font-bold text-[#1E1B4B]">
                  <span>{minBudget} €/mes</span>
                  <span className="text-xs text-stone-400 font-normal">━━━━●━━━━</span>
                  <span>{maxBudget} €/mes</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase">Mínimo</span>
                    <input
                      type="number"
                      step="50"
                      min="300"
                      max="3000"
                      value={minBudget}
                      onChange={(e) => setMinBudget(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase">Máximo habitual</span>
                    <input
                      type="number"
                      step="50"
                      min="400"
                      max="5000"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-800"
                    />
                  </div>
                </div>
              </div>

              {/* Presupuesto flexible por preferencias */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-amber-950">
                  ¿Aceptas pagar un poco más por determinadas características?
                </label>
                <p className="text-xs text-stone-600">
                  Ejemplo: «Mi presupuesto máximo es {maxBudget} €, pero podría llegar hasta{' '}
                  <strong className="text-amber-900">{stretchBudget} €</strong> si la vivienda cumple mis imprescindibles (terraza, ascensor o piscina)».
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={maxBudget}
                    max={maxBudget + 500}
                    step="50"
                    value={stretchBudget}
                    onChange={(e) => setStretchBudget(Number(e.target.value))}
                    className="flex-1 accent-[#D97706]"
                  />
                  <span className="text-xs font-bold text-amber-900 px-3 py-1 rounded-lg bg-amber-200/80 border border-amber-300">
                    Hasta {stretchBudget} €
                  </span>
                </div>
              </div>

              {/* Gastos incluidos deseados */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  ¿Qué suministros esperas que estén incluidos en la mensualidad?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'community', label: 'Comunidad' },
                    { id: 'water', label: 'Agua' },
                    { id: 'electricity', label: 'Electricidad' },
                    { id: 'internet', label: 'Internet / WiFi' },
                  ].map((item) => {
                    const isChecked = utilitiesIncluded[item.id as keyof typeof utilitiesIncluded];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setUtilitiesIncluded(prev => ({
                            ...prev,
                            [item.id]: !isChecked,
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                          isChecked
                            ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {isChecked ? '✓ ' : ''}{item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Ubicación y movilidad */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D97706]" />
                  4. 📍 Ubicación y movilidad
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Calculamos tiempos de trayecto exactos hacia tu lugar de trabajo o estudio.
                </p>
              </div>

              {/* Auto location button */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block leading-tight">Activar ubicación actual</span>
                    <span className="text-[10px] text-stone-500">Detecta tu ciudad por GPS o conexión</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectTenantCity}
                  disabled={isLocatingCity}
                  className="px-3 py-1.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                  id="btn-onboarding-auto-locate"
                >
                  {isLocatingCity ? (
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

              {/* Dibujar zona personalizada en el mapa (Idealista Style) */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block leading-tight">
                        {customPolygon && customPolygon.length >= 3 
                          ? `Zona personalizada dibujada (${customPolygon.length} vértices)` 
                          : 'Dibujar zona de alquiler en el mapa'}
                      </span>
                      <span className="text-[10px] text-indigo-600/90">
                        {customPolygon && customPolygon.length >= 3
                          ? `Tu búsqueda está delimitada al polígono trazado en ${targetCity}`
                          : 'Traza con el dedo o ratón la zona exacta donde quieres vivir en el mapa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {customPolygon && customPolygon.length >= 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPolygon([]);
                          setCityFeedback('Zona dibujada eliminada.');
                          setTimeout(() => setCityFeedback(null), 2500);
                        }}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold"
                        title="Eliminar zona dibujada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDrawZoneModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                      id="btn-onboarding-draw-zone"
                    >
                      <Pencil className="w-3 h-3 text-amber-400" />
                      <span>{customPolygon && customPolygon.length >= 3 ? 'Modificar zona' : 'Dibujar zona'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {cityFeedback && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                  {cityFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ciudad deseada en España</label>
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                  >
                    {SPANISH_CITIES_CATALOG.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Barrios o zonas preferidas</label>
                  <input
                    type="text"
                    value={targetNeighborhoods}
                    onChange={(e) => setTargetNeighborhoods(e.target.value)}
                    placeholder="Ej. Centro, Soho, Teatinos, Triana..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Radio alrededor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">Radio de búsqueda alrededor de la zona</label>
                  <span className="text-xs font-bold text-[#1E1B4B]">{searchRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="50"
                  step="2"
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#1E1B4B]"
                />
              </div>

              {/* Tiempo de trayecto */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  ¿Cuánto tiempo máximo quieres tardar en llegar al trabajo/universidad?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: '15', label: '15 min' },
                    { id: '30', label: '30 min' },
                    { id: '45', label: '45 min' },
                    { id: '60', label: '60 min' },
                    { id: 'any', label: 'Me da igual' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMaxCommuteMinutes(t.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        String(maxCommuteMinutes) === t.id
                          ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cómo te desplazas */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">¿Cómo te desplazas normalmente?</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'walking', icon: '🚶', label: 'A pie' },
                    { id: 'bike', icon: '🚲', label: 'Bicicleta' },
                    { id: 'public', icon: '🚌', label: 'Transporte público' },
                    { id: 'car', icon: '🚗', label: 'Coche' },
                    { id: 'moto', icon: '🛵', label: 'Moto' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTransportMode(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        transportMode === m.id
                          ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs font-bold'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 font-medium'
                      }`}
                    >
                      <div className="text-lg">{m.icon}</div>
                      <div className="text-[11px] leading-tight mt-1">{m.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 italic mt-1">
                  💡 Esto nos permite calcular etiquetas automáticas: «Esta vivienda está a 22 min de tu trabajo».
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Preferencias de vivienda tipo Tinder */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    5. ⭐ Preferencias de vivienda (Estilo Swipe)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {essentialAmenities.length}/5 Imprescindibles
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Elige la importancia de cada característica. Puedes marcar un <strong>máximo de 5 imprescindibles</strong>.
                </p>
              </div>

              {/* Interactive Card Slider / Tinder style */}
              <div className="p-4 rounded-3xl bg-gradient-to-b from-stone-50 to-white border-2 border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                  <span>CARACTERÍSTICA {cardIndex + 1} DE {AMENITIES_LIST.length}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCardIndex(prev => Math.max(0, prev - 1))}
                      disabled={cardIndex === 0}
                      className="p-1 rounded bg-stone-100 disabled:opacity-30 hover:bg-stone-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardIndex(prev => Math.min(AMENITIES_LIST.length - 1, prev + 1))}
                      disabled={cardIndex === AMENITIES_LIST.length - 1}
                      className="p-1 rounded bg-stone-100 disabled:opacity-30 hover:bg-stone-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const item = AMENITIES_LIST[cardIndex];
                  const currentPriority = amenityPriorities[item.id] || 'neutral';
                  return (
                    <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs text-center space-y-4">
                      <div className="text-4xl">{item.icon}</div>
                      <div>
                        <h4 className="text-base font-bold text-[#1E1B4B]">{item.label}</h4>
                        <p className="text-xs text-stone-500">¿Qué importancia tiene para ti?</p>
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAmenityPriority(item.id, 'essential');
                            if (cardIndex < AMENITIES_LIST.length - 1) setCardIndex(prev => prev + 1);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            currentPriority === 'essential'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-102'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300'
                          }`}
                        >
                          <span className="text-base">❤️</span>
                          <span>Imprescindible</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAmenityPriority(item.id, 'like');
                            if (cardIndex < AMENITIES_LIST.length - 1) setCardIndex(prev => prev + 1);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            currentPriority === 'like'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-102'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300'
                          }`}
                        >
                          <span className="text-base">👍</span>
                          <span>Me gusta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAmenityPriority(item.id, 'neutral');
                            if (cardIndex < AMENITIES_LIST.length - 1) setCardIndex(prev => prev + 1);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            currentPriority === 'neutral'
                              ? 'bg-stone-700 text-white border-stone-800 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <span className="text-base">😐</span>
                          <span>Me da igual</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAmenityPriority(item.id, 'dislike');
                            if (cardIndex < AMENITIES_LIST.length - 1) setCardIndex(prev => prev + 1);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            currentPriority === 'dislike'
                              ? 'bg-stone-400 text-white border-stone-500 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <span className="text-base">👎</span>
                          <span>No me importa</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick List Overview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-stone-700">Tus imprescindibles seleccionados:</span>
                <div className="flex flex-wrap gap-1.5">
                  {essentialAmenities.length === 0 ? (
                    <span className="text-xs text-stone-400 italic">Ningún imprescindible seleccionado todavía.</span>
                  ) : (
                    essentialAmenities.map(id => {
                      const item = AMENITIES_LIST.find(a => a.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold">
                          ❤️ {item?.label || id}
                          <button
                            type="button"
                            onClick={() => setAmenityPriority(id, 'neutral')}
                            className="ml-1 text-rose-500 hover:text-rose-700"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Estilo de vida */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Dog className="w-5 h-5 text-[#D97706]" />
                  6. 🐕 Estilo de vida y convivencia
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Información clave para propietarios que buscan perfiles compatibles con la comunidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fumar */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">¿Fumas?</label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'no', label: 'No' },
                      { id: 'yes', label: 'Sí' },
                      { id: 'outside', label: 'Solo fuera' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSmoking(f.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          smoking === f.id ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teletrabajo */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">¿Trabajas desde casa?</label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'never', label: 'Nunca' },
                      { id: 'sometimes', label: 'Algunos días' },
                      { id: 'mostly', label: 'La mayoría' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setRemoteWork(w.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          remoteWork === w.id ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cómo describirías tu estilo de vida */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">¿Cómo describirías tu estilo de vida?</label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'tranquil', label: 'Tranquilo' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'social', label: 'Social' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setLifestyleVibe(s.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          lifestyleVibe === s.id ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vivir con compañeros */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">¿Te interesa compartir con compañeros?</label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'yes', label: 'Sí' },
                      { id: 'no', label: 'No' },
                      { id: 'any', label: 'Me da igual' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setWantsRoommates(c.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          wantsRoommates === c.id ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Si busca habitación o compartir */}
              {propertyTypes.includes('habitacion') && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <span className="text-xs font-bold text-amber-950 block">Preferencias específicas para habitación:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'quietVibe', label: '¿Ambiente tranquilo?' },
                      { key: 'likesGuests', label: '¿Te gusta recibir visitas?' },
                      { key: 'prefersStudents', label: '¿Prefieres compartir con estudiantes?' },
                      { key: 'prefersProfessionals', label: '¿Prefieres profesionales?' },
                      { key: 'sharesBathroom', label: '¿Aceptas compartir baño?' },
                      { key: 'privateRoom', label: '¿Habitación privada con cerradura?' },
                    ].map(pref => {
                      const val = roomPreferences[pref.key as keyof typeof roomPreferences];
                      return (
                        <button
                          key={pref.key}
                          type="button"
                          onClick={() => {
                            setRoomPreferences(prev => ({
                              ...prev,
                              [pref.key]: !val,
                            }));
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                            val ? 'bg-white border-amber-400 text-amber-950 font-bold' : 'bg-white/60 border-stone-200 text-stone-600'
                          }`}
                        >
                          <span className="text-[11px]">{pref.label}</span>
                          <span className="text-xs font-bold">{val ? '✓ Sí' : 'No'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Situación económica y duración */}
          {step === 7 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#D97706]" />
                  7. 💼 Situación económica y duración
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Para acreditar solvencia sin comprometer información sensible en primera instancia.
                </p>
              </div>

              {/* Situación laboral */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Situación laboral</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'indefinido', label: 'Contrato indefinido' },
                    { id: 'temporal', label: 'Contrato temporal' },
                    { id: 'autonomo', label: 'Autónomo / Freelance' },
                    { id: 'estudiante', label: 'Estudiante' },
                    { id: 'funcionario', label: 'Funcionario' },
                    { id: 'busqueda', label: 'En búsqueda de empleo' },
                  ].map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setEmploymentType(emp.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        employmentType === emp.id
                          ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {emp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingresos mensuales aproximados */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Ingresos netos mensuales aproximados</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { range: '< 1.000 €', val: 950 },
                    { range: '1.000–1.500 €', val: 1350 },
                    { range: '1.500–2.000 €', val: 1850 },
                    { range: '2.000–3.000 €', val: 2450 },
                    { range: '3.000 €+', val: 3500 },
                  ].map((inc) => (
                    <button
                      key={inc.range}
                      type="button"
                      onClick={() => {
                        setIncomeRange(inc.range);
                        setMonthlyIncome(inc.val);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        incomeRange === inc.range
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {inc.range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    ¿Puedes aportar nóminas / documentación si es necesario?
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'yes', label: 'Sí' },
                      { id: 'no', label: 'No' },
                      { id: 'later', label: 'Más adelante' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCanProvideDocs(d.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          canProvideDocs === d.id ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">¿Cuentas con avalista solidario?</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasGuarantor(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        !hasGuarantor ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasGuarantor(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        hasGuarantor ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]' : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      Sí
                    </button>
                  </div>
                </div>
              </div>

              {/* Entrada y Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">📅 ¿Cuándo quieres entrar?</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">📅 ¿Cuánto tiempo quieres alquilar?</label>
                  <select
                    value={rentalDuration}
                    onChange={(e) => setRentalDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                  >
                    <option value="1-3m">1–3 meses</option>
                    <option value="3-6m">3–6 meses</option>
                    <option value="6-12m">6–12 meses</option>
                    <option value="1-2y">1–2 años</option>
                    <option value="long_term">Largo plazo (&gt; 2 años)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-500 font-bold text-xs hover:text-stone-800"
            >
              Completar más tarde
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl bg-[#1E1B4B] text-white font-bold text-xs hover:bg-[#28235C] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4 text-[#D97706]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !hasMinPhotos}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1E1B4B] to-emerald-800 text-white font-bold text-xs hover:opacity-95 flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{loading ? 'Guardando perfil...' : 'Guardar y Explorar Viviendas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal interactivo para dibujar zona de búsqueda */}
      <LocationPickerModal
        isOpen={isDrawZoneModalOpen}
        onClose={() => setIsDrawZoneModalOpen(false)}
        selectedCity={targetCity}
        initialTab="draw"
        customPolygon={customPolygon.length >= 3 ? customPolygon : null}
        onSelectCity={(city) => {
          setTargetCity(city.name);
          setCustomPolygon([]);
          setCityFeedback(`📍 Ciudad seleccionada: ${city.name}`);
          setTimeout(() => setCityFeedback(null), 3000);
        }}
        onSelectCustomZone={(polygon, approxCity) => {
          setCustomPolygon(polygon);
          setTargetCity(approxCity);
          setCityFeedback(`✏️ Zona dibujada en ${approxCity} (${polygon.length} vértices) guardada`);
          setTimeout(() => setCityFeedback(null), 3500);
        }}
      />
    </div>
  );
};

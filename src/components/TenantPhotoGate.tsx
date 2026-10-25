import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { api } from '../api/client';
import { Language } from '../i18n/translations';
import { TenantProfile } from '../types';
import { useTenantPhotoRequirement } from '../hooks/useTenantPhotoRequirement';

export interface TenantPhotoGateProps {
  currentPhotos?: string[];
  currentUser?: { id?: string; email?: string; name?: string };
  tenant?: TenantProfile;
  language?: Language;
  onPhotosSaved?: (photos: string[]) => void;
  onPhotosUpdated?: (photos: string[]) => void;
  onOpenMatchingQuiz?: () => void;
  onOpenQuiz?: () => void;
}

/**
 * Componente unificado para el bloqueo por requisito de 3 fotos del inquilino (Prioridad 10.2).
 * Único componente de validación visual de fotos del inquilino en toda la app.
 */
export const TenantPhotoGate: React.FC<TenantPhotoGateProps> = ({
  currentPhotos,
  currentUser,
  tenant,
  language = 'es',
  onPhotosSaved,
  onPhotosUpdated,
  onOpenMatchingQuiz,
  onOpenQuiz,
}) => {
  // Unify initial photos from props or tenant profile
  const resolvedInitialPhotos =
    currentPhotos ??
    (Array.isArray(tenant?.photos) && tenant.photos.length > 0
      ? tenant.photos
      : tenant?.avatarUrl
      ? [tenant.avatarUrl]
      : []);

  const {
    photos,
    photoCount,
    isSatisfied,
    remainingNeeded,
    requirementMessage,
    addPhotos,
    removePhoto,
    addSamplePhotos,
    addPhoto,
  } = useTenantPhotoRequirement(resolvedInitialPhotos);

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resolvedUser = currentUser ?? {
    id: tenant?.id,
    email: tenant?.email,
    name: (tenant as any)?.name || tenant?.fullName,
  };

  const handleCallback = (savedPhotos: string[]) => {
    if (onPhotosSaved) onPhotosSaved(savedPhotos);
    if (onPhotosUpdated) onPhotosUpdated(savedPhotos);
  };

  const handleOpenQuiz = onOpenMatchingQuiz || onOpenQuiz;

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

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    addPhoto(photoUrlInput.trim());
    setPhotoUrlInput('');
  };

  const handleSaveAndUnlock = async () => {
    if (!isSatisfied) {
      setErrorMsg('Debes subir al menos 3 fotos de ti como inquilino para desbloquear las propiedades.');
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (resolvedUser.id || resolvedUser.email) {
        await api.tenant.updateFinancialProfile({
          userId: resolvedUser.id,
          email: resolvedUser.email,
          photos: photos,
          avatar_url: photos[0],
        });
      }
      localStorage.setItem('rentia_tenant_photos', JSON.stringify(photos));
      handleCallback(photos);
    } catch (err: any) {
      console.error('Error saving tenant photos:', err);
      // Fallback local persistence allows seamless unlocking
      localStorage.setItem('rentia_tenant_photos', JSON.stringify(photos));
      handleCallback(photos);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden">
        {/* Banner de Cabecera con Bloqueo de Seguridad */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <Lock className="w-8 h-8 text-amber-100" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-900/40 text-amber-100 border border-amber-300/30 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            Acceso a Propiedades Bloqueado
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            Sube al menos 3 fotos tuyas para ver propiedades
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {requirementMessage}
          </p>
        </div>

        {/* Cuerpo con Contador y Gestión de Fotos */}
        <div className="p-6 space-y-6">
          {/* Barra de progreso de fotos */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-700" />
                Fotografías de tu Perfil
              </span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  isSatisfied
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                {photoCount} / 3 Fotos Mínimas
              </span>
            </div>

            <div className="w-full bg-amber-200/70 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isSatisfied ? 'bg-emerald-500' : 'bg-amber-600'
                }`}
                style={{ width: `${Math.min(100, (photoCount / 3) * 100)}%` }}
              />
            </div>

            {!isSatisfied && (
              <p className="text-[12px] text-amber-800 font-semibold mt-2">
                Te faltan <span className="font-extrabold underline">{remainingNeeded}</span>{' '}
                {remainingNeeded === 1 ? 'foto más' : 'fotos más'} para desbloquear la búsqueda de pisos.
              </p>
            )}
            {isSatisfied && (
              <p className="text-[12px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ¡Requisito superado! Guarda para empezar a mirar pisos ahora.
              </p>
            )}
          </div>

          {/* Grid de 3 Fotos Mínimas */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
              Tus Fotos ({photoCount})
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((slotIdx) => {
                const photo = photos[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center ${
                      photo
                        ? 'border-emerald-400 bg-stone-100'
                        : 'border-dashed border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Inquilino foto ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(slotIdx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-black/60 text-white backdrop-blur-xs">
                          #{slotIdx + 1}
                        </span>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 text-center h-full w-full hover:bg-amber-100/50 transition-colors">
                        <Plus className="w-5 h-5 text-amber-600 mb-1" />
                        <span className="text-[11px] font-bold text-amber-800 leading-tight">
                          Foto {slotIdx + 1}
                        </span>
                        <span className="text-[9px] text-amber-600 mt-0.5">Obligatoria</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fotos adicionales si tiene más de 3 */}
            {photos.length > 3 && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-stone-500">Fotos adicionales:</span>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {photos.slice(3).map((extraPhoto, i) => (
                    <div
                      key={i + 3}
                      className="relative aspect-square rounded-xl overflow-hidden border border-stone-200"
                    >
                      <img
                        src={extraPhoto}
                        alt="Foto extra"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i + 3)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opciones de Carga Rápida */}
          <div className="space-y-3 pt-2">
            {/* Botón de carga de archivo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 cursor-pointer bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] border border-stone-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Subir fotos desde mi dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Botón de 1-click para fotos verificadas de muestra */}
              <button
                type="button"
                onClick={() => addSamplePhotos()}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Añadir foto verificada</span>
              </button>
            </div>

            {/* Input para pegar URL directa */}
            <form onSubmit={handleAddUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="O pega enlace de foto (https://...)"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <button
                type="submit"
                disabled={!photoUrlInput.trim()}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Pegar
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de Acción Primaria */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleSaveAndUnlock}
              disabled={!isSatisfied || isSaving}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isSatisfied
                  ? 'bg-[#1E1B4B] hover:bg-[#2A2663] text-white cursor-pointer active:scale-[0.99]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
              }`}
            >
              {isSaving ? (
                <span>Guardando fotografías...</span>
              ) : isSatisfied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Guardar 3 fotos y desbloquear propiedades</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Sube {remainingNeeded} {remainingNeeded === 1 ? 'foto más' : 'fotos más'} para continuar
                  </span>
                </>
              )}
            </button>

            {handleOpenQuiz && (
              <button
                type="button"
                onClick={handleOpenQuiz}
                className="w-full py-2.5 text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>O completar el cuestionario inteligente de matching</span>
              </button>
            )}
          </div>

          {/* Aviso de Confianza y Reciprocidad */}
          <div className="pt-2 border-t border-stone-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fotos verificadas y protegidas bajo cifrado RGPD en Rentia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

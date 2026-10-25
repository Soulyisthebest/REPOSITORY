import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  UploadCloud, 
  Camera, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  FileText,
  Lock,
  UserCheck
} from 'lucide-react';
import { api } from '../api/client';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    is_verified?: boolean;
    verification_status?: string;
  };
  onVerificationSubmitted?: () => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onVerificationSubmitted,
}) => {
  const [docType, setDocType] = useState<'DNI' | 'NIE' | 'Pasaporte'>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [dniFront, setDniFront] = useState<string | null>(null);
  const [dniBack, setDniBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniFront) {
      setError('Por favor sube la foto de tu DNI / documento de identidad.');
      return;
    }
    if (!selfie) {
      setError('Por favor sube una fotografía tuya (selfie) para cotejar tu identidad.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.kyc.submit({
        user_id: currentUser.id,
        user_name: currentUser.name || 'Usuario Rentia',
        user_email: currentUser.email || '',
        user_role: (currentUser.role as any) || 'tenant',
        id_document_number: docNumber.trim() || undefined,
        id_document_type: docType,
        dni_front_url: dniFront,
        dni_back_url: dniBack || undefined,
        selfie_url: selfie,
        selfie_with_id_url: selfie,
      });

      setSuccess(true);
      if (onVerificationSubmitted) {
        onVerificationSubmitted();
      }
    } catch (err: any) {
      console.error('Error submitting KYC:', err);
      setError(err.message || 'Error al enviar la documentación de verificación.');
    } finally {
      setLoading(false);
    }
  };

  const isPending = currentUser.verification_status === 'pending_admin' || success;
  const isVerified = currentUser.is_verified || currentUser.verification_status === 'verified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Verificación de Identidad</h3>
              <p className="text-xs text-emerald-100">
                Obtén el Check Verde Verificado validado por administración
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Banners */}
          {isVerified ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 text-emerald-800">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-emerald-950">¡Tu perfil ya está verificado!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  La verificación con DNI se realiza una única vez. Tu identidad ya ha sido contrastada y validada de forma definitiva por el equipo de administración.
                </p>
              </div>
            </div>
          ) : isPending ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 text-amber-900">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-amber-950">Documentación en revisión por Administración</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Has subido tu DNI y fotografía correctamente. La verificación con DNI se tramita una sola vez. En cuanto el equipo valide la documentación, el Check Verde quedará activo de forma permanente.
                </p>
              </div>
            </div>
          ) : null}

          {!isVerified && !isPending && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>La verificación con DNI se hace una única vez:</strong> Para otorgar el <strong>Check Verde</strong> y garantizar la máxima seguridad contra estafas, contrastamos tu documento de identidad una sola vez. Tus documentos se procesan con cifrado seguro y nunca tendrás que volver a verificarlos.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Document info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full text-xs font-medium text-slate-800 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="DNI">DNI (España)</option>
                    <option value="NIE">NIE (Extranjeros residentes)</option>
                    <option value="Pasaporte">Pasaporte Internacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Documento (opcional)
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                    placeholder="Ej. 12345678Z"
                    className="w-full text-xs text-slate-800 px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              {/* Photo of ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>1. Foto de tu DNI / NIE / Pasaporte <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 transition-colors text-center bg-slate-50/50">
                  {dniFront ? (
                    <div className="space-y-2">
                      <img
                        src={dniFront}
                        alt="DNI Frontal"
                        className="max-h-36 mx-auto rounded-lg object-contain border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setDniFront(null)}
                        className="text-xs text-rose-600 hover:underline font-medium"
                      >
                        Cambiar foto del DNI
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 block">
                        Subir foto del DNI (anverso)
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        PNG, JPG o PDF legible
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setDniFront)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>2. Foto tuya (Selfie) con o sin tu DNI <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 transition-colors text-center bg-slate-50/50">
                  {selfie ? (
                    <div className="space-y-2">
                      <img
                        src={selfie}
                        alt="Selfie"
                        className="max-h-36 mx-auto rounded-lg object-contain border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setSelfie(null)}
                        className="text-xs text-rose-600 hover:underline font-medium"
                      >
                        Cambiar fotografía
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-800 block">
                        Subir foto tuya actual (Selfie)
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Asegúrate de que tu rostro se vea nítido
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSelfie)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading || !dniFront || !selfie}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando para revisión...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enviar a Administrador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {(isVerified || isPending) && (
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-all"
              >
                Cerrar ventana
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

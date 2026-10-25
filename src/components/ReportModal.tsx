import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  FileWarning, 
  Flag,
  UserX,
  Building
} from 'lucide-react';
import { api } from '../api/client';
import { Language } from '../i18n/translations';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'listing' | 'tenant_profile' | 'user';
  targetId: string;
  targetTitle?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  currentUser?: { id: string; name?: string; email?: string; role?: string };
  language?: Language;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetUserId,
  targetUserName,
  targetUserEmail,
  currentUser,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('suspected_scam');
  const [details, setDetails] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reasonsList = [
    { id: 'suspected_scam', label: 'Estafa o intento de fraude económico' },
    { id: 'fake_content', label: 'Perfil falsificado o suplantación de identidad' },
    { id: 'wrong_photos', label: 'Fotos falsas o no corresponden a la realidad' },
    { id: 'price_fraud', label: 'Precio engañoso o cobro indebido de comisiones' },
    { id: 'inappropriate_behavior', label: 'Comportamiento inapropiado o mensajes abusivos' },
    { id: 'other', label: 'Otro motivo de seguridad' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Por favor, indica una breve descripción del motivo de la denuncia.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedReasonObj = reasonsList.find(r => r.id === reason);
      await api.reports.createReport({
        target_type: targetType,
        target_id: targetId,
        target_title: targetTitle || (targetType === 'listing' ? 'Anuncio de inmueble' : 'Perfil de usuario'),
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        target_user_email: targetUserEmail,
        reason: reason as any,
        reason_label: selectedReasonObj?.label || reason,
        details: details.trim(),
        evidence_url: evidenceUrl.trim() || undefined,
        reporter_id: currentUser?.id,
        reporter_name: currentUser?.name,
        reporter_email: currentUser?.email,
      });

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message || 'No se pudo enviar la denuncia. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setDetails('');
    setEvidenceUrl('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Señalar o denunciar irregularidad
              </h3>
              <p className="text-xs text-slate-600">
                Protección contra estafas y perfiles falsos en Rentia
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-rose-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Denuncia recibida con éxito</h4>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Nuestro equipo de moderación y administración ha recibido el aviso de seguridad.
                  Si se confirma la estafa o infracción, la cuenta y el anuncio serán bloqueados de forma inmediata.
                </p>
              </div>
              <button
                onClick={handleResetAndClose}
                className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-md"
              >
                Entendido y cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Element being reported */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                {targetType === 'listing' ? (
                  <Building className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                ) : (
                  <UserX className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {targetType === 'listing' ? 'Anuncio señalado' : 'Perfil señalado'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {targetTitle || targetUserName || `Elemento #${targetId.substring(0, 8)}`}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reason selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Motivo de la denuncia <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {reasonsList.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        reason === r.id
                          ? 'border-rose-500 bg-rose-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={(e) => setReason(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Detailed description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detalles explicativos <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explica detalladamente qué irregularidad has detectado (ej. pide dinero por adelantado sin visita, fotos robadas de internet, no contesta y pide bizum...)"
                  className="w-full text-xs text-slate-800 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none"
                />
              </div>

              {/* Evidence URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace a prueba o captura (opcional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... captura o enlace externo"
                  className="w-full text-xs text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-medium text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando denuncia...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" />
                      <span>Enviar a moderación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

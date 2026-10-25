import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  Scale,
  Loader2,
  Mail
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api, setAuthToken } from '../api/client';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentTenant?: any;
  onAccountDeleted?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  language,
  currentTenant,
  onAccountDeleted,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'rights'>('privacy');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadData = async () => {
    setIsExporting(true);
    setActionMessage(null);
    try {
      const data = await api.tenant.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rentia_mis_datos_rgpd_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionMessage({
        type: 'success',
        text: t.exportDataSuccessToast,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error exporting data.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setActionMessage(null);
    try {
      await api.tenant.deleteAccount();
      setAuthToken(null);
      setActionMessage({
        type: 'success',
        text: t.accountDeletedToast,
      });
      setTimeout(() => {
        if (onAccountDeleted) onAccountDeleted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error deleting account.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#0FA3A3]/20 relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F7FBFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FA3A3] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C3B3A]">
                {t.privacyCenterHeaderTitle}
              </h2>
              <p className="text-xs text-[#5C7B79]">
                {t.privacyCenterHeaderDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            id="btn-close-privacy-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legal Advisory Banner */}
        <div className="bg-[#FEF9E7] border-b border-[#F2C94C]/40 px-4 py-2.5 flex items-start gap-2 text-xs text-[#7A5800]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#E67E22] mt-0.5" />
          <p className="leading-tight">
            <strong>{t.legalDraftDisclaimerTitle} :</strong>{' '}
            {t.legalDraftDisclaimerText}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-4 pt-2 bg-white gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy' 
                ? 'border-[#0FA3A3] text-[#0FA3A3]' 
                : 'border-transparent text-[#5C7B79] hover:text-[#1C3B3A]'
            }`}
            id="tab-privacy-policy"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.privacyPolicyTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'terms' 
                ? 'border-[#0FA3A3] text-[#0FA3A3]' 
                : 'border-transparent text-[#5C7B79] hover:text-[#1C3B3A]'
            }`}
            id="tab-terms-of-service"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{t.termsTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rights')}
            className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rights' 
                ? 'border-[#0FA3A3] text-[#0FA3A3]' 
                : 'border-transparent text-[#5C7B79] hover:text-[#1C3B3A]'
            }`}
            id="tab-gdpr-rights"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.gdprRightsTab}</span>
          </button>
        </div>

        {/* Feedback message */}
        {actionMessage && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Tab Contents - Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-[#1C3B3A] leading-relaxed flex-1">
          
          {/* TAB 1: POLÍTICA DE PRIVACIDAD */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7FBFA] rounded-xl border border-[#0FA3A3]/15">
                <h3 className="font-bold text-sm text-[#0FA3A3] mb-1">
                  1. Responsable del Tratamiento de Datos
                </h3>
                <p>
                  <strong>Identidad:</strong> Rentia Reputation Technologies S.L. (en constitución)<br />
                  <strong>Domicilio social:</strong> Calle Gran Vía 28, 28013 Madrid, España.<br />
                  <strong>Correo de contacto / DPO:</strong> <a href="mailto:dpo@rentia.app" className="text-[#0FA3A3] font-semibold underline">dpo@rentia.app</a>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  2. Datos Recabados y Finalidad del Tratamiento
                </h4>
                <p>Rentia recopila los datos estrictamente necesarios (principio de minimización, Art. 5.1.c RGPD) para prestar el servicio de pasaporte de reputación:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[#5C7B79]">
                  <li><strong>Datos de cuenta:</strong> Nombre completo, correo electrónico, teléfono y preferencias de idioma.</li>
                  <li><strong>Datos contractuales y residenciales:</strong> Dirección del inmueble alquilado, importe de renta, fianza y fechas de inicio/fin extraídas del contrato.</li>
                  <li><strong>Procesamiento IA (Gemini 3.7 Flash):</strong> Los documentos subidos se analizan para extraer automáticamente los datos clave y crear la solicitud de validación.</li>
                  <li><strong>Verificaciones de arrendadores:</strong> Evaluaciones sobre puntualidad en pagos, cuidado del inmueble y recomendaciones, selladas criptográficamente.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  3. Base Jurídica y Legitimación (Art. 6 RGPD)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[#5C7B79]">
                  <li><strong>Consentimiento expreso (Art. 6.1.a):</strong> Otorgado de forma inequívoca al registrarse mediante casilla de verificación no pre-marcada.</li>
                  <li><strong>Ejecución del contrato de servicio (Art. 6.1.b):</strong> Para generar el pasaporte, procesar el contrato y permitir la validación del propietario.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  4. Destinatarios y Transferencias Internacionales
                </h4>
                <p className="text-[#5C7B79]">
                  Sus datos son alojados en infraestructura segura en la Unión Europea (Supabase / Google Cloud). Solo son compartidos con terceros (futuros caseros) cuando usted comparte voluntariamente su código de pasaporte o enlace de verificación.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  5. Plazos de Conservación y Supresión
                </h4>
                <p className="text-[#5C7B79]">
                  Los documentos y datos se conservan mientras mantenga su cuenta activa. Si solicita la supresión de su cuenta, los archivos de contrato son purgados inmediatamente de Supabase Storage y los datos personales son completamente anonimizados, manteniendo únicamente los hashes criptográficos matemáticos para preservar la integridad anti-fraude.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TÉRMINOS DE SERVICIO */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7FBFA] rounded-xl border border-[#0FA3A3]/15">
                <h3 className="font-bold text-sm text-[#0FA3A3] mb-1">
                  Condiciones Generales de Uso de Rentia
                </h3>
                <p className="text-[#5C7B79]">
                  Al utilizar Rentia, usted acepta las presentes condiciones que rigen el uso del pasaporte digital de reputación para inquilinos.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  1. Veracidad Documental y Prohibición de Fraude
                </h4>
                <p className="text-[#5C7B79]">
                  El usuario garantiza que cualquier contrato o justificante aportado es auténtico y corresponde a un arrendamiento real. La falsificación de documentos o la creación fraudulenta de referencias falsas supondrá la expulsión inmediata de la plataforma y la revocación de todas las acreditaciones.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  2. Certificaciones Inmutables de Arrendadores (Protocolo WORM)
                </h4>
                <p className="text-[#5C7B79]">
                  Una vez que un arrendador emite una evaluación y queda sellada con su firma digital y hash criptográfico, la atestación se convierte en inmutable para garantizar la fiabilidad del sistema frente a futuros propietarios.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#5C7B79] mb-1">
                  3. Limitación de Responsabilidad
                </h4>
                <p className="text-[#5C7B79]">
                  Rentia actúa como facilitador tecnológico y certificador de reputación. Rentia no interviene como parte en los contratos de arrendamiento futuros ni garantiza el cumplimiento de obligaciones entre inquilinos y propietarios.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TUS DERECHOS RGPD & ACCIONES DIRECTAS */}
          {activeTab === 'rights' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7FBFA] rounded-xl border border-[#0FA3A3]/15">
                <h3 className="font-bold text-sm text-[#0FA3A3] mb-1">
                  Panel de Ejercicio de Derechos RGPD
                </h3>
                <p className="text-[#5C7B79]">
                  Conforme a los artículos 15 a 22 del RGPD, usted dispone del control absoluto sobre su información personal.
                </p>
              </div>

              {/* Action 1: Export Data (Art. 15 & 20) */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#0FA3A3]" />
                    <span className="font-bold text-xs text-[#1C3B3A]">
                      {language === 'es' ? '1. Portabilidad de Datos (JSON)' : '1. Data Portability (JSON)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-[#E6F7F6] text-[#0FA3A3] px-2 py-0.5 rounded-full">
                    Art. 20 RGPD
                  </span>
                </div>
                <p className="text-[#5C7B79] text-xs">
                  {language === 'es' 
                    ? 'Descargue una copia completa y estructurada en formato legible (JSON) con su perfil, historial de baux, contratos, pagos y eventos de consentimiento.' 
                    : 'Download a full structured copy (JSON) containing your profile, lease history, contracts, payments, and consent logs.'}
                </p>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  disabled={isExporting}
                  className="mt-1 py-2 px-3 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-60"
                  id="btn-export-gdpr-data"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{language === 'es' ? 'Descargar todos mis datos (JSON)' : 'Download my data (JSON)'}</span>
                </button>
              </div>

              {/* Action 2: Right to Erasure (Art. 17) */}
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <Trash2 className="w-4 h-4" />
                    <span className="font-bold text-xs">
                      {language === 'es' ? '2. Derecho al Olvido y Supresión' : '2. Right to Erasure / Deletion'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    Art. 17 RGPD
                  </span>
                </div>
                <p className="text-[#5C7B79] text-xs">
                  {language === 'es'
                    ? 'Purga automáticamente sus documentos de contratos del almacenamiento de Supabase y anonimiza irreversiblemente su nombre, email y teléfono.'
                    : 'Purges all your contract documents from storage and irreversibly anonymizes your personal name, email, and phone number.'}
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-1 py-2 px-3 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 transition-all"
                    id="btn-request-gdpr-erasure"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Solicitar Supresión y Anonimización' : 'Request Erasure & Anonymization'}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-red-300 space-y-2">
                    <p className="text-xs font-bold text-red-800">
                      {language === 'es'
                        ? '¿Confirmar supresión definitiva? Esta acción no se puede deshacer.'
                        : 'Confirm permanent erasure? This action cannot be undone.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1"
                        id="btn-confirm-gdpr-delete"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>{language === 'es' ? 'Sí, suprimir mis datos' : 'Yes, erase my data'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="py-1.5 px-3 rounded-lg bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200"
                      >
                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DPO Contact */}
              <div className="p-3 bg-[#F7FBFA] rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1C3B3A] block">
                    {language === 'es' ? 'Delegado de Protección de Datos (DPO)' : 'Data Protection Officer (DPO)'}
                  </span>
                  <span className="text-[#5C7B79]">dpo@rentia.app</span>
                </div>
                <a
                  href="mailto:dpo@rentia.app"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#0FA3A3]/20 text-[#0FA3A3] font-bold hover:bg-[#E6F7F6] flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Contactar' : 'Contact'}</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-[#F7FBFA] flex items-center justify-between">
          <span className="text-[11px] text-[#5C7B79]">
            Rentia Compliance RGPD • Versión 1.0 (2026)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-[#0FA3A3] text-white font-bold text-xs hover:bg-[#0D8C8C] transition-colors"
            id="btn-close-privacy-footer"
          >
            {language === 'es' ? 'Entendido y Cerrar' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

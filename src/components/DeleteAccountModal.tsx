import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  PauseCircle, 
  Trash2, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  Loader2,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import { api } from '../api/client';
import { Language } from '../i18n/translations';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeactivated: () => void;
  onDeleted: () => void;
  isLandlord?: boolean;
  language?: Language | string;
}

const MODAL_I18N = {
  es: {
    keyword: 'ELIMINAR',
    titleSelect: 'Gestionar o eliminar mi cuenta',
    titleConfirm: 'Confirmación de eliminación definitiva',
    subSelect: 'Elige entre una pausa temporal reversible o la eliminación definitiva',
    subConfirm: 'Acción irreversible sujeta a validación por texto',
    warningBanner: 'Antes de continuar, lee atentamente la diferencia entre ambas opciones. La primera es temporal y reversible, la segunda es definitiva e irreversible.',
    opt1Title: '1. Desactivar temporalmente mi cuenta',
    opt1Badge: 'Opción reversible en cualquier momento',
    opt1Bullet1Title: 'Invisibilidad inmediata:',
    opt1Bullet1Desc: (isLandlord: boolean) =>
      `Tu perfil ya no aparecerá en el descubrimiento de ${isLandlord ? 'inquilinos' : 'propietarios'}, ni en las búsquedas activas.`,
    opt1Bullet2Title: 'Cero pérdida de datos:',
    opt1Bullet2Desc: 'Tus contratos, certificaciones verificadas, reputación y documentos permanecen intactos y seguros.',
    opt1Bullet3Title: 'Reactivación instantánea:',
    opt1Bullet3Desc: 'Solo tendrás que volver a iniciar sesión con tus credenciales habituales para reactivar tu cuenta de inmediato.',
    opt1BtnDeactivating: 'Desactivando...',
    opt1Btn: 'Desactivar temporalmente mi cuenta',
    opt2Title: '2. Eliminar definitivamente mi cuenta',
    opt2Badge: 'Acción irreversible • RGPD Art. 17',
    opt2Bullet1Title: 'Anonimización estricta:',
    opt2Bullet1Desc: 'Tu nombre, email, teléfono y datos personales se anonimizan de forma irreversible según el RGPD.',
    opt2Bullet2Title: 'Purga integral del almacenamiento:',
    opt2Bullet2Desc: 'Todos tus contratos y justificantes subidos se eliminan definitivamente de los servidores.',
    opt2Bullet3Title: 'Sello antifraude:',
    opt2Bullet3Desc: 'Únicamente los certificados ya validados por terceros conservan su huella criptográfica sellada.',
    opt2Bullet4Title: 'Definitivamente irrecuperable:',
    opt2Bullet4Desc: 'Nunca podrás volver a iniciar sesión ni restaurar este pasaporte o perfil.',
    opt2Btn: 'Eliminar definitivamente mi cuenta...',
    backToOptions: 'Volver a las opciones',
    doubleConfirmTitle: 'Doble confirmación obligatoria',
    doubleConfirmDesc:
      'Esta acción es definitiva e irreversible. Tu pasaporte, datos de contacto y archivos asociados serán purgados y anonimizados de conformidad con el RGPD.',
    promptText: 'Para confirmar, escribe',
    promptBelow: 'a continuación:',
    helperActive: 'El botón de borrado definitivo se habilitará al escribir exactamente la palabra requerida.',
    cancelBtn: 'Cancelar',
    confirmDeleteBtn: 'Confirmar eliminación definitiva',
    deletingText: 'Eliminando cuenta...',
    errKeyword: 'Debes escribir exactamente la palabra ELIMINAR para confirmar.',
    errDeactivate: 'Error al desactivar la cuenta.',
    errDelete: 'Error al eliminar definitivamente la cuenta.',
  },
  en: {
    keyword: 'DELETE',
    titleSelect: 'Manage or delete my account',
    titleConfirm: 'Permanent deletion confirmation',
    subSelect: 'Choose between a reversible pause or permanent deletion',
    subConfirm: 'Irreversible action requiring text confirmation',
    warningBanner: 'Before proceeding, please carefully review the differences between both options. The first is temporary and reversible; the second is permanent and irreversible.',
    opt1Title: '1. Temporarily deactivate my account',
    opt1Badge: 'Reversible at any time',
    opt1Bullet1Title: 'Immediate invisibility:',
    opt1Bullet1Desc: (isLandlord: boolean) =>
      `Your profile will no longer appear in the discovery deck for ${isLandlord ? 'tenants' : 'landlords'}, nor in candidate search results.`,
    opt1Bullet2Title: 'Zero data loss:',
    opt1Bullet2Desc: 'Your leases, verified certificates, reputation, and documents stay intact and secure.',
    opt1Bullet3Title: 'Instant reactivation:',
    opt1Bullet3Desc: 'Simply log back in anytime with your credentials to reactivate your account immediately.',
    opt1BtnDeactivating: 'Deactivating...',
    opt1Btn: 'Temporarily deactivate my account',
    opt2Title: '2. Permanently delete my account',
    opt2Badge: 'Irreversible action • GDPR Art. 17',
    opt2Bullet1Title: 'Strict anonymization:',
    opt2Bullet1Desc: 'Your name, email, phone number, and personal data will be permanently anonymized per GDPR.',
    opt2Bullet2Title: 'Full storage purge:',
    opt2Bullet2Desc: 'All uploaded lease files and verification documents will be deleted from servers.',
    opt2Bullet3Title: 'Anti-fraud seal:',
    opt2Bullet3Desc: 'Only certificates already sealed by third parties retain their cryptographic hashes.',
    opt2Bullet4Title: 'Permanently unrecoverable:',
    opt2Bullet4Desc: 'You will never be able to log in again or restore this passport or profile.',
    opt2Btn: 'Permanently delete my account...',
    backToOptions: 'Back to options',
    doubleConfirmTitle: 'Mandatory double confirmation',
    doubleConfirmDesc:
      'This action is final and irreversible. Your passport, contact details, and hosted contract files will be permanently purged in accordance with GDPR.',
    promptText: 'To confirm, type',
    promptBelow: 'below:',
    helperActive: 'The permanent deletion button will unlock once the exact word is typed.',
    cancelBtn: 'Cancel',
    confirmDeleteBtn: 'Confirm permanent deletion',
    deletingText: 'Deleting account...',
    errKeyword: 'Please type the word DELETE exactly to confirm.',
    errDeactivate: 'Error deactivating account.',
    errDelete: 'Error permanently deleting account.',
  },
  fr: {
    keyword: 'SUPPRIMER',
    titleSelect: 'Gérer ou supprimer mon compte',
    titleConfirm: 'Confirmation de suppression définitive',
    subSelect: 'Choisissez entre une pause réversible ou une suppression définitive',
    subConfirm: 'Action irréversible soumise à validation textuelle',
    warningBanner: 'Avant de continuer, veuillez lire attentivement la différence entre les deux options ci-dessous. L\'une est temporaire et réversible, l\'autre est définitive et irréversible.',
    opt1Title: '1. Désactiver temporairement mon compte',
    opt1Badge: 'Option réversible à tout moment',
    opt1Bullet1Title: 'Invisibilité immédiate :',
    opt1Bullet1Desc: (isLandlord: boolean) =>
      `Votre profil n'apparaît plus dans le deck de découverte des ${isLandlord ? 'locataires' : 'propriétaires'}, ni dans les recherches.`,
    opt1Bullet2Title: 'Zéro perte de données :',
    opt1Bullet2Desc: 'Vos baux, attestations certifiées, réputation et documents restent intacts et en sécurité.',
    opt1Bullet3Title: 'Réactivation instantanée :',
    opt1Bullet3Desc: 'Il vous suffira de vous reconnecter avec vos identifiants habituels pour réactiver votre compte sans aucune démarche.',
    opt1BtnDeactivating: 'Désactivation en cours...',
    opt1Btn: 'Désactiver temporairement mon compte',
    opt2Title: '2. Supprimer définitivement mon compte',
    opt2Badge: 'Action irréversible • RGPD Art. 17',
    opt2Bullet1Title: 'Anonymisation stricte :',
    opt2Bullet1Desc: 'Votre nom, email, téléphone et données personnelles sont définitivement anonymisés conformément au RGPD.',
    opt2Bullet2Title: 'Purge intégrale du stockage :',
    opt2Bullet2Desc: 'Tous vos fichiers de contrats et justificatifs hébergés sont purgés.',
    opt2Bullet3Title: 'Sceau anti-fraude :',
    opt2Bullet3Desc: 'Seules les attestations déjà vérifiées par un tiers conservent leur empreinte cryptographique scellée.',
    opt2Bullet4Title: 'Définitivement irrécupérable :',
    opt2Bullet4Desc: 'Vous ne pourrez plus jamais vous connecter ni restaurer ce passeport.',
    opt2Btn: 'Supprimer définitivement mon compte...',
    backToOptions: 'Retour au choix des options',
    doubleConfirmTitle: 'Double confirmation obligatoire',
    doubleConfirmDesc:
      'Cette action est définitive et irréversible. Votre passeport locatif, vos coordonnées et tous vos fichiers de contrats stockés seront immédiatement purgés et anonymisés conformément au RGPD.',
    promptText: 'Pour confirmer, tapez',
    promptBelow: 'ci-dessous :',
    helperActive: 'Le bouton d\'effacement définitif sera activé dès la saisie exacte du mot.',
    cancelBtn: 'Annuler',
    confirmDeleteBtn: 'Confirmer la suppression définitive',
    deletingText: 'Suppression en cours...',
    errKeyword: 'Veuillez saisir exactement le mot SUPPRIMER pour confirmer.',
    errDeactivate: 'Erreur lors de la désactivation du compte.',
    errDelete: 'Erreur lors de la suppression définitive du compte.',
  }
};

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeactivated,
  onDeleted,
  isLandlord = false,
  language = 'es',
}) => {
  const [step, setStep] = useState<'select' | 'confirm_delete'>('select');
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLang = (language === 'fr' || language === 'en' ? language : 'es') as 'es' | 'en' | 'fr';
  const txt = MODAL_I18N[currentLang];

  const resetState = () => {
    setStep('select');
    setConfirmInput('');
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.tenant.deactivateAccount();
      resetState();
      onDeactivated();
    } catch (err: any) {
      setErrorMessage(err.message || txt.errDeactivate);
      setIsLoading(false);
    }
  };

  const handleDeletePermanent = async () => {
    if (confirmInput.trim().toUpperCase() !== txt.keyword) {
      setErrorMessage(txt.errKeyword);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.tenant.deleteAccount();
      resetState();
      onDeleted();
    } catch (err: any) {
      setErrorMessage(err.message || txt.errDelete);
      setIsLoading(false);
    }
  };

  const isConfirmed = confirmInput.trim().toUpperCase() === txt.keyword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        id="modal-delete-account"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">
                {step === 'select' ? txt.titleSelect : txt.titleConfirm}
              </h2>
              <p className="text-xs text-stone-500">
                {step === 'select' ? txt.subSelect : txt.subConfirm}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50"
            id="btn-close-delete-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'select' ? (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                {txt.warningBanner}
              </div>

              {/* Option 1: Temporary Deactivation */}
              <div className="p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-300 bg-white transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                      <PauseCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E1B4B]">
                        {txt.opt1Title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {txt.opt1Badge}
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="text-xs text-stone-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt1Bullet1Title}</strong> {txt.opt1Bullet1Desc(isLandlord)}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt1Bullet2Title}</strong> {txt.opt1Bullet2Desc}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt1Bullet3Title}</strong> {txt.opt1Bullet3Desc}</span>
                  </li>
                </ul>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDeactivate}
                    disabled={isLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    id="btn-confirm-deactivate-account"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{txt.opt1BtnDeactivating}</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>{txt.opt1Btn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: Permanent Deletion */}
              <div className="p-5 rounded-2xl border-2 border-stone-200 hover:border-rose-300 bg-white transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E1B4B]">
                        {txt.opt2Title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        {txt.opt2Badge}
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="text-xs text-stone-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt2Bullet1Title}</strong> {txt.opt2Bullet1Desc}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt2Bullet2Title}</strong> {txt.opt2Bullet2Desc}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt2Bullet3Title}</strong> {txt.opt2Bullet3Desc}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>{txt.opt2Bullet4Title}</strong> {txt.opt2Bullet4Desc}</span>
                  </li>
                </ul>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setStep('confirm_delete');
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-stone-100 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-stone-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    id="btn-start-permanent-delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{txt.opt2Btn}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Double Confirmation with explicit validation keyword */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setStep('select');
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#1E1B4B] transition-colors"
                id="btn-back-to-options"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{txt.backToOptions}</span>
              </button>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{txt.doubleConfirmTitle}</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  {txt.doubleConfirmDesc}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-stone-700">
                  {txt.promptText} <span className="text-rose-600 font-mono tracking-wider font-extrabold">{txt.keyword}</span> {txt.promptBelow}
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={txt.keyword}
                  autoFocus
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm font-mono tracking-widest text-center uppercase"
                  id="input-confirm-delete-account"
                />
                <p className="text-[11px] text-stone-500 text-center">
                  {txt.helperActive}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                  id="btn-cancel-delete-account"
                >
                  {txt.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleDeletePermanent}
                  disabled={!isConfirmed || isLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-execute-permanent-delete"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{txt.deletingText}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{txt.confirmDeleteBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  KeyRound,
  ArrowLeft,
  Smartphone,
  Info,
  Briefcase,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api, setAuthToken } from '../api/client';
import { supabase, isClientSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
  currentTenant?: { name: string; email: string; role?: UserRole } | null;
  onLogout?: () => void;
  onOpenPrivacyPolicy?: () => void;
  language: Language;
  initialMode?: 'login' | 'register';
  selectedRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentTenant,
  onLogout,
  onOpenPrivacyPolicy,
  language,
  initialMode = 'login',
  selectedRole = 'tenant',
}) => {
  const t = TRANSLATIONS[language];
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Separate role context for login and register
  const [loginRole, setLoginRole] = useState<'tenant' | 'landlord' | 'agency'>(
    selectedRole === 'agency' ? 'agency' : selectedRole === 'landlord' ? 'landlord' : 'tenant'
  );
  const [registerRole, setRegisterRole] = useState<'tenant' | 'landlord' | 'agency'>(
    selectedRole === 'agency' ? 'agency' : selectedRole === 'landlord' ? 'landlord' : 'tenant'
  );

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDemoHint, setOtpDemoHint] = useState<string | null>(null);
  const [isRealSmsDelivered, setIsRealSmsDelivered] = useState<boolean | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
    setIsPhoneVerified(false);
    setIsOtpSent(false);
    setOtpCode('');
    setOtpDemoHint(null);
    setIsRealSmsDelivered(null);
    if (selectedRole === 'agency') {
      setLoginRole('agency');
      setRegisterRole('agency');
    } else if (selectedRole === 'landlord') {
      setLoginRole('landlord');
      setRegisterRole('landlord');
    } else {
      setLoginRole('tenant');
      setRegisterRole('tenant');
    }
  }, [initialMode, isOpen, selectedRole]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 6) {
      setError(
        language === 'es'
          ? 'Introduce un número de teléfono válido antes de solicitar el código SMS.'
          : 'Veuillez saisir un numéro de téléphone valide.'
      );
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    setOtpDemoHint(null);
    try {
      const res = await api.auth.requestPhoneOtp({
        phone: phone.trim(),
        lang: language,
        purpose: 'register',
      });
      setIsOtpSent(true);
      const isReal = Boolean(res.realSmsSent || (res as any).realSms);
      setIsRealSmsDelivered(isReal);
      const code = res.demoCode || (res as any).devCode;
      if (code) {
        setOtpDemoHint(code);
      }
      if (isReal) {
        setSuccessMessage(
          language === 'es'
            ? '✓ Código SMS enviado con éxito a tu teléfono móvil.'
            : 'Code SMS envoyé avec succès sur votre mobile.'
        );
      } else {
        setSuccessMessage(
          res.message ||
            (language === 'es'
              ? 'Código SMS generado.'
              : 'Code SMS généré.')
        );
      }
    } catch (err: any) {
      if (
        err.message?.includes('PHONE_ALREADY_EXISTS') ||
        err.message?.includes('ya está registrado') ||
        err.message?.includes('already associated') ||
        err.message?.includes('déjà associé')
      ) {
        setError(
          language === 'es'
            ? 'Este número de teléfono ya está registrado en Rentia (asociado a una cuenta existente). Cada cuenta debe tener un teléfono único.'
            : 'Ce numéro de téléphone est déjà associé à un compte.'
        );
      } else {
        setError(err.message || 'Error al enviar código SMS');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setError(
        language === 'es'
          ? 'Introduce el código de verificación recibido.'
          : 'Veuillez saisir le code reçu.'
      );
      return;
    }
    setError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await api.auth.verifyPhoneOtp({
        phone: phone.trim(),
        otp: otpCode.trim(),
        lang: language,
      });
      if (res.verified) {
        setIsPhoneVerified(true);
        setSuccessMessage(
          res.message ||
            (language === 'es'
              ? 'Teléfono verificado con éxito ✓'
              : 'Téléphone vérifié avec succès ✓')
        );
      }
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError(
        language === 'es' ? 'Introduce tu correo electrónico.' : 'Veuillez renseigner votre email.'
      );
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword({
        email: email.trim().toLowerCase(),
        preferred_lang: language,
      });
      setSuccessMessage(
        res.message ||
          (language === 'es'
            ? 'Te hemos enviado las instrucciones a tu correo.'
            : 'Instructions envoyées par email.')
      );
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el restablecimiento.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`\\/]/.test(password);
  const isPasswordStrong = hasMinLen && hasUpper && hasLower && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'register') {
      if (!isPasswordStrong) {
        setError(
          language === 'es'
            ? 'La contraseña debe ser de alta seguridad: mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos especiales (!@#$%...).'
            : 'Le mot de passe doit être hautement sécurisé : minimum 8 caractères avec majuscules, minuscules, chiffres et symboles.'
        );
        return;
      }
      if (!privacyAccepted) {
        setError(t.mustAcceptPrivacyError);
        return;
      }
      if (!phone || !phone.trim()) {
        setError(t.phoneRequiredError || 'El número de teléfono es obligatorio.');
        return;
      }
      if (!isPhoneVerified) {
        setError(
          language === 'es'
            ? 'Debes verificar tu número de teléfono por SMS antes de registrarte.'
            : 'Veuillez vérifier votre numéro de téléphone par SMS avant de finaliser votre inscription.'
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Login with explicit role verification to avoid mixing tenant and landlord accounts
        const loginRes = await api.auth.login(
          email.trim().toLowerCase(),
          password,
          language,
          loginRole
        );

        if (loginRes.sessionId) {
          localStorage.setItem('rentia_session_id', loginRes.sessionId);
        }

        if (loginRes.token) {
          setAuthToken(loginRes.token);
          if (isClientSupabaseConfigured() && !loginRes.token.startsWith('rentia_local_')) {
            await supabase.auth
              .setSession({
                access_token: loginRes.token,
                refresh_token: loginRes.token,
              })
              .catch(() => {});
          }
        }

        onAuthSuccess(loginRes.tenant);
        onClose();
      } else {
        // Registration with mandatory phone and strictly unique email & phone
        const res = await api.auth.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          role: registerRole,
          preferred_lang: language,
          privacy_policy_accepted: privacyAccepted,
          otp: otpCode.trim(),
        });

        if (res.token) {
          setAuthToken(res.token);
          if (isClientSupabaseConfigured() && !res.token.startsWith('rentia_local_')) {
            await supabase.auth
              .setSession({
                access_token: res.token,
                refresh_token: res.token,
              })
              .catch(() => {});
          }
        }

        onAuthSuccess(res.tenant);
        onClose();
      }
    } catch (err: any) {
      if (
        err.message?.includes('ACCOUNT_CLOSED') ||
        err.message?.includes('cerrada') ||
        err.message?.includes('suprimida')
      ) {
        setError(
          language === 'es'
            ? 'Esta cuenta ha sido suprimida o cerrada definitivamente. Ya no tiene acceso a la plataforma.'
            : language === 'en'
            ? 'This account has been permanently closed. You no longer have access to the platform.'
            : 'Ce compte a été supprimé ou fermé définitivement. Vous ne pouvez plus y accéder.'
        );
      } else if (
        err.message?.includes('403') ||
        err.message?.includes('401') ||
        err.message?.includes('INVALID_CREDENTIALS') ||
        err.message?.includes('contraseña') ||
        err.message?.includes('password') ||
        err.message?.includes('Invalid login') ||
        err.message?.includes('credenciales') ||
        err.message?.includes('Unauthorized') ||
        err.message?.includes('Forbidden')
      ) {
        setError(
          language === 'es'
            ? 'Correo electrónico o contraseña incorrectos.'
            : language === 'en'
            ? 'Incorrect email or password.'
            : 'Adresse e-mail ou mot de passe incorrect.'
        );
      } else if (
        err.message?.includes('EMAIL_ALREADY_EXISTS') ||
        err.message?.includes('correo electrónico ya está registrado')
      ) {
        setError(
          language === 'es'
            ? 'Este correo electrónico ya está registrado en Rentia (asociado a una cuenta existente). Un único correo por cuenta.'
            : 'Cette adresse e-mail est déjà associée à un compte Rentia existant.'
        );
      } else if (
        err.message?.includes('PHONE_ALREADY_EXISTS') ||
        err.message?.includes('número de teléfono ya está registrado') ||
        err.message?.includes('déjà associé') ||
        err.message?.includes('already associated') ||
        err.message?.includes('idx_profiles_phone_unique')
      ) {
        setError(
          language === 'es'
            ? 'Este número de teléfono ya está registrado en Rentia (asociado a una cuenta existente). Un único teléfono por cuenta.'
            : 'Ce numéro de téléphone est déjà associé à un compte.'
        );
      } else if (
        err.message?.includes('ROLE_MISMATCH') ||
        err.message?.includes('registrada como')
      ) {
        setError(err.message);
      } else if (
        err.message?.includes('USER_NOT_FOUND') ||
        err.message?.includes('No existe ninguna cuenta')
      ) {
        setError(
          language === 'es'
            ? 'No existe ninguna cuenta registrada con este correo electrónico. Por favor, crea una cuenta primero en la pestaña Registrarse.'
            : 'Aucun compte associé à cette adresse e-mail. Veuillez d’abord vous inscrire.'
        );
      } else if (
        err.message?.includes('ACCOUNT_SUSPENDED') ||
        err.message?.includes('suspendida') ||
        err.message?.includes('suspendu')
      ) {
        setError(
          language === 'es'
            ? 'Tu cuenta ha sido suspendida. Por favor, contacta con el soporte de Rentia.'
            : 'Votre compte a été suspendu. Veuillez contacter le support.'
        );
      } else {
        setError(
          err.message ||
            (language === 'es' ? 'Correo electrónico o contraseña incorrectos.' : "Adresse e-mail ou mot de passe incorrect.")
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeRole = mode === 'login' ? loginRole : registerRole;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative animate-fade-in max-h-[92vh] overflow-y-auto"
        id="auth-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          id="btn-close-auth-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xs ${
              activeRole === 'agency'
                ? 'bg-indigo-50 text-indigo-700'
                : activeRole === 'landlord'
                ? 'bg-teal-50 text-[#0FA3A3]'
                : 'bg-[#1E1B4B] text-white'
            }`}
          >
            {mode === 'forgot_password' ? (
              <KeyRound className="w-6 h-6 text-[#D97706]" />
            ) : activeRole === 'agency' ? (
              <Briefcase className="w-6 h-6 text-indigo-700" />
            ) : activeRole === 'landlord' ? (
              <Building2 className="w-6 h-6 text-[#0FA3A3]" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#D97706]" />
            )}
          </div>
          <h2 className="text-xl font-black text-[#1E1B4B]">
            {mode === 'login'
              ? t.login
              : mode === 'register'
              ? t.register
              : language === 'es'
              ? 'Recuperar contraseña'
              : 'Mot de passe oublié'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'login'
              ? language === 'es'
                ? `Acceso para ${activeRole === 'agency' ? 'Agencias Inmobiliarias' : activeRole === 'landlord' ? 'Propietarios Privados' : 'Inquilinos'}`
                : t.authLoginSubtitle
              : mode === 'register'
              ? language === 'es'
                ? `Crear cuenta de ${activeRole === 'agency' ? 'Agencia Inmobiliaria' : activeRole === 'landlord' ? 'Propietario Privado' : 'Inquilino'}`
                : t.authRegisterSubtitle
              : language === 'es'
              ? 'Introduce tu correo para recibir las instrucciones.'
              : 'Entrez votre email pour recevoir le lien.'}
          </p>
        </div>

        {/* Tab switcher: Iniciar sesión / Registrarse */}
        {mode !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#1E1B4B] shadow-xs'
                  : 'text-stone-500 hover:text-[#1E1B4B]'
              }`}
              id="tab-auth-login"
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#1E1B4B] shadow-xs'
                  : 'text-stone-500 hover:text-[#1E1B4B]'
              }`}
              id="tab-auth-register"
            >
              {t.register}
            </button>
          </div>
        )}

        {/* EXCLUSIVE ROLE SELECTOR TAB (Separación estricta de bases de datos/logins) */}
        {mode !== 'forgot_password' && (
          <div className="mb-4 p-1.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                {mode === 'login' ? 'Portal de acceso' : 'Apartado de inscripción'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') setLoginRole('tenant');
                  else setRegisterRole('tenant');
                  setError(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeRole === 'tenant'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
                id="btn-select-role-tenant"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Inquilino</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') setLoginRole('landlord');
                  else setRegisterRole('landlord');
                  setError(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeRole === 'landlord'
                    ? 'bg-[#0FA3A3] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
                id="btn-select-role-landlord"
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Propietario</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') setLoginRole('agency');
                  else setRegisterRole('agency');
                  setError(null);
                }}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeRole === 'agency'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
                id="btn-select-role-agency"
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Agencia</span>
              </button>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Success notice */}
        {successMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot_password' ? (
          <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#1E1B4B] mb-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : language === 'es' ? (
                'Enviar enlace de recuperación'
              ) : (
                'Envoyer le lien'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full text-center text-xs text-stone-500 font-semibold hover:text-[#1E1B4B] flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>
                {language === 'es' ? 'Volver al inicio de sesión' : 'Retour à la connexion'}
              </span>
            </button>
          </form>
        ) : (
          /* Form Login / Register */
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block font-bold text-[#1E1B4B] mb-1">
                  {activeRole === 'agency'
                    ? (language === 'es' ? 'Nombre de la Agencia Inmobiliaria o Titular' : t.fullNameLabel)
                    : activeRole === 'landlord'
                    ? (language === 'es' ? 'Nombre completo del Propietario' : t.fullNameLabel)
                    : t.fullNameLabel}
                </label>
                <div className="relative">
                  {activeRole === 'agency' ? (
                    <Briefcase className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  ) : activeRole === 'landlord' ? (
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  )}
                  <input
                    type="text"
                    required
                    placeholder={
                      activeRole === 'agency'
                        ? (language === 'es' ? 'Ej: Inmobiliaria Central / Carlos Ruiz' : t.fullNamePlaceholder)
                        : t.fullNamePlaceholder
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#1E1B4B] mb-1">
                {t.emailLabel} <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
              {mode === 'register' && (
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Un único correo por cuenta en todo el sistema.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#1E1B4B]">{t.passwordLabel}</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[#D97706] hover:underline font-semibold"
                  >
                    {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Mot de passe oublié ?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>

              {/* High Security Password Live Checklist for Register */}
              {mode === 'register' && (
                <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-stone-500">Requisitos de seguridad:</span>
                    <span className={isPasswordStrong ? 'text-emerald-700' : 'text-amber-700'}>
                      {isPasswordStrong ? '✓ Alta seguridad cumplida' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className={`flex items-center gap-1 ${hasMinLen ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                      <span>{hasMinLen ? '✓' : '○'}</span> Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                      <span>{hasUpper ? '✓' : '○'}</span> Mayúscula (A-Z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                      <span>{hasLower ? '✓' : '○'}</span> Minúscula (a-z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                      <span>{hasNumber ? '✓' : '○'}</span> Número (0-9)
                    </span>
                    <span className={`col-span-2 flex items-center gap-1 ${hasSymbol ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                      <span>{hasSymbol ? '✓' : '○'}</span> Símbolo especial (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <>
                {/* Mandatory Phone Field & Real SMS OTP Verification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#1E1B4B] flex items-center gap-1">
                      <span>{t.phoneLabel}</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    {isPhoneVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verificado ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#0FA3A3] bg-teal-50 px-1.5 py-0.5 rounded">
                        SMS obligatorio
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="tel"
                        required
                        disabled={isPhoneVerified}
                        placeholder={t.phonePlaceholder}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setIsPhoneVerified(false);
                          setIsOtpSent(false);
                          setOtpDemoHint(null);
                        }}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] disabled:bg-stone-100"
                      />
                    </div>
                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !phone}
                        className="px-3 py-2 bg-[#1E1B4B] hover:bg-[#28235C] text-white font-bold rounded-xl text-[11px] shrink-0 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isOtpSent ? (
                          'Reenviar código'
                        ) : (
                          'Enviar código'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Clean 6-digit confirmation block */}
                  {isOtpSent && !isPhoneVerified && (
                    <div className="mt-2.5 p-3 bg-stone-50 border border-stone-200 rounded-2xl animate-fade-in space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1E1B4B] flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-[#0FA3A3]" />
                          Código de verificación recibido
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">
                          6 dígitos
                        </span>
                      </div>

                      <p className="text-[10px] text-stone-500 leading-tight">
                        Introduce el código de 6 dígitos enviado por SMS a {phone}:
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white rounded-xl border border-stone-300 font-mono text-center tracking-widest text-sm font-bold text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || !otpCode}
                          className="px-4 py-2 bg-[#0FA3A3] hover:bg-[#0d8c8c] text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
                        </button>
                      </div>

                      {otpDemoHint && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                          <span className="text-[10px] text-stone-400">¿Revisando en desarrollo?</span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(otpDemoHint)}
                            className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline"
                          >
                            Pegar código recibido
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400 mt-1">
                    Un único teléfono por cuenta en todo el sistema.
                  </p>
                </div>

                {/* RGPD Mandatory Consent */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-[#1E1B4B]">
                    <input
                      type="checkbox"
                      required
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer shrink-0"
                      id="checkbox-privacy-consent"
                    />
                    <span className="leading-tight text-stone-600">
                      He leído y acepto la{' '}
                      <button
                        type="button"
                        onClick={onOpenPrivacyPolicy}
                        className="text-[#D97706] font-bold hover:underline"
                      >
                        Política de Privacidad
                      </button>{' '}
                      y el tratamiento exclusivo de mis datos conforme al RGPD.
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && !isPhoneVerified)}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60 text-white ${
                activeRole === 'agency'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : activeRole === 'landlord'
                  ? 'bg-[#0FA3A3] hover:bg-[#0d8c8c]'
                  : 'bg-[#1E1B4B] hover:bg-[#28235C]'
              }`}
              id="btn-auth-submit"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>
                    Iniciar sesión como {activeRole === 'agency' ? 'Agencia Inmobiliaria' : activeRole === 'landlord' ? 'Propietario Privado' : 'Inquilino'}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>
                    Inscribirse como {activeRole === 'agency' ? 'Agencia Inmobiliaria' : activeRole === 'landlord' ? 'Propietario Privado' : 'Inquilino'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

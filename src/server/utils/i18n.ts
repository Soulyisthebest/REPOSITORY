export type SupportedLanguage = 'es' | 'fr' | 'en';

export const BACKEND_MESSAGES: Record<string, Record<SupportedLanguage, string>> = {
  // Auth & General
  UNAUTHORIZED: {
    es: 'No autorizado. Se requiere un token de sesión válido.',
    fr: 'Non autorisé. Un jeton de session valide est requis.',
    en: 'Unauthorized. A valid session token is required.',
  },
  INVALID_OR_EXPIRED_TOKEN: {
    es: 'Sesión expirada o token inválido.',
    fr: 'Session expirée ou jeton invalide.',
    en: 'Expired session or invalid token.',
  },
  ACCOUNT_SUSPENDED: {
    es: 'Tu cuenta ha sido suspendida. Por favor, ponte en contacto con el soporte de Rentia.',
    fr: 'Votre compte a été suspendu. Veuillez contacter le support Rentia.',
    en: 'Your account has been suspended. Please contact Rentia support.',
  },
  MISSING_FIELDS: {
    es: 'Por favor, completa todos los campos obligatorios.',
    fr: 'Veuillez remplir tous les champs obligatoires.',
    en: 'Please fill in all required fields.',
  },
  EMAIL_REQUIRED: {
    es: 'El correo electrónico es obligatorio.',
    fr: "L'adresse email est obligatoire.",
    en: 'Email is required.',
  },
  PASSWORD_REQUIRED: {
    es: 'La contraseña es obligatoria.',
    fr: 'Le mot de passe est obligatoire.',
    en: 'Password is required.',
  },
  PHONE_REQUIRED: {
    es: 'El número de teléfono es obligatorio.',
    fr: 'Le numéro de téléphone est obligatoire.',
    en: 'Phone number is required.',
  },
  PRIVACY_POLICY_REQUIRED: {
    es: 'Debes aceptar la política de privacidad y protección de datos (RGPD).',
    fr: 'Vous devez accepter la politique de confidentialité et de protection des données (RGPD).',
    en: 'You must accept the privacy and data protection policy (GDPR).',
  },
  INVALID_CREDENTIALS: {
    es: 'Correo electrónico o contraseña incorrectos.',
    fr: 'Email ou mot de passe incorrect.',
    en: 'Invalid email or password.',
  },
  PHONE_ALREADY_EXISTS: {
    es: 'Este número de teléfono ya está asociado a otra cuenta.',
    fr: 'Ce numéro de téléphone est déjà associé à un autre compte.',
    en: 'This phone number is already associated with another account.',
  },
  EMAIL_ALREADY_EXISTS: {
    es: 'Este correo electrónico ya está registrado.',
    fr: 'Cette adresse email est déjà enregistrée.',
    en: 'This email is already registered.',
  },
  RATE_LIMIT_LOGIN: {
    es: 'Demasiados intentos fallidos. Por seguridad, espera {minutes} minutos antes de volver a intentarlo.',
    fr: 'Trop de tentatives de connexion infructueuses. Veuillez patienter {minutes} minutes.',
    en: 'Too many failed login attempts. Please wait {minutes} minutes before trying again.',
  },
  OTP_SENT: {
    es: 'Código de verificación SMS enviado con éxito.',
    fr: 'Code de vérification SMS envoyé avec succès.',
    en: 'SMS verification code sent successfully.',
  },
  OTP_INVALID: {
    es: 'Código de verificación incorrecto o expirado.',
    fr: 'Code de vérification incorrect ou expiré.',
    en: 'Invalid or expired verification code.',
  },
  OTP_VERIFIED: {
    es: 'Número de teléfono verificado con éxito.',
    fr: 'Numéro de téléphone vérifié avec succès.',
    en: 'Phone number verified successfully.',
  },
  PASSWORD_RESET_SENT: {
    es: 'Si el correo existe en Rentia, recibirás un enlace de restablecimiento.',
    fr: 'Si cet email existe dans Rentia, vous recevrez un lien de réinitialisation.',
    en: 'If this email exists in Rentia, you will receive a reset link.',
  },

  // Tenant / Profile
  PROFILE_LOAD_ERROR: {
    es: 'Error al cargar el perfil de usuario.',
    fr: 'Erreur lors du chargement du profil utilisateur.',
    en: 'Error loading user profile.',
  },
  NAME_CANNOT_BE_EMPTY: {
    es: 'El nombre no puede estar vacío.',
    fr: 'Le nom ne peut pas être vide.',
    en: 'Name cannot be empty.',
  },
  PROFILE_UPDATED: {
    es: 'Perfil actualizado con éxito.',
    fr: 'Profil mis à jour avec succès.',
    en: 'Profile updated successfully.',
  },
  PROFILE_UPDATE_ERROR: {
    es: 'Error al actualizar el perfil.',
    fr: 'Erreur lors de la mise à jour du profil.',
    en: 'Error updating profile.',
  },
  EXPORT_DATA_ERROR: {
    es: 'Error al exportar los datos RGPD.',
    fr: "Erreur lors de l'export des données RGPD.",
    en: 'Error exporting GDPR data.',
  },
  ACCOUNT_DELETED: {
    es: 'Cuenta y datos personales eliminados y anonimizados conforme al RGPD.',
    fr: 'Compte et données personnelles supprimés et anonymisés conformément au RGPD.',
    en: 'Account and personal data erased and anonymized under GDPR.',
  },
  ACCOUNT_DELETION_ERROR: {
    es: 'Error al eliminar la cuenta.',
    fr: 'Erreur lors de la suppression du compte.',
    en: 'Error deleting account.',
  },
  ACCOUNT_DEACTIVATED: {
    es: 'Cuenta desactivada temporalmente. Tu perfil y anuncios quedan ocultos.',
    fr: 'Compte désactivé temporairement. Votre profil et vos annonces sont masqués.',
    en: 'Account deactivated temporarily. Your profile and listings are hidden.',
  },
  ACCOUNT_DEACTIVATION_ERROR: {
    es: 'Error al desactivar la cuenta.',
    fr: 'Erreur lors de la désactivation du compte.',
    en: 'Error deactivating account.',
  },

  // Leases
  LEASE_NOT_FOUND: {
    es: 'Contrato de alquiler no encontrado.',
    fr: 'Contrat de location introuvable.',
    en: 'Rental lease not found.',
  },
  LEASE_CREATED: {
    es: 'Contrato registrado y archivado con éxito.',
    fr: 'Location créée et contrat archivé avec succès.',
    en: 'Lease created and contract archived successfully.',
  },
  LEASE_CREATE_ERROR: {
    es: 'Error al registrar el contrato.',
    fr: 'Erreur lors de la création de la location.',
    en: 'Error creating lease.',
  },
  LEASE_DELETED: {
    es: 'Contrato eliminado con éxito.',
    fr: 'Location supprimée avec succès.',
    en: 'Lease deleted successfully.',
  },
  LEASE_DELETE_ERROR: {
    es: 'Error al eliminar el contrato.',
    fr: 'Erreur lors de la suppression de la location.',
    en: 'Error deleting lease.',
  },
  LEASE_VERIFIED_LOCK: {
    es: 'BLOQUEO DE SEGURIDAD: Un contrato ya certificado por el propietario no puede modificarse ni eliminarse.',
    fr: 'VERROUILLAGE DE SÉCURITÉ: Une location déjà certifiée par le propriétaire ne peut plus être modifiée ou supprimée.',
    en: 'SECURITY LOCK: A lease already verified by the landlord cannot be modified or deleted.',
  },
  CONTRACT_EXTRACTION_MISSING_DATA: {
    es: 'Por favor, proporciona al menos una página del contrato o el texto.',
    fr: 'Veuillez fournir au moins une page du contrat ou le texte.',
    en: 'Please provide at least one contract page or text.',
  },

  // Matching & Chat
  ONLY_LANDLORD_CAN_MESSAGE_FIRST: {
    es: 'Por seguridad, el propietario debe enviar el primer mensaje tras el match.',
    fr: 'Par sécurité, le propriétaire doit envoyer le premier message après le match.',
    en: 'For security, the landlord must send the first message after a match.',
  },
  LISTING_PHOTO_MINIMUM: {
    es: 'Cada anuncio debe tener al menos 10 fotos verificadas.',
    fr: 'Chaque annonce doit comporter au moins 10 photos vérifiées.',
    en: 'Each listing must include at least 10 verified photos.',
  },
  LISTING_LIMIT_REACHED: {
    es: 'Has alcanzado el límite máximo de 10 anuncios por propietario.',
    fr: 'Vous avez atteint la limite maximale de 10 annonces par propriétaire.',
    en: 'You have reached the maximum limit of 10 listings per landlord.',
  },
  ADMIN_ACCESS_REQUIRED: {
    es: 'Acceso restringido a administradores de Rentia.',
    fr: 'Accès restreint aux administrateurs de Rentia.',
    en: 'Restricted access to Rentia administrators.',
  },
};

export function getReqLang(req: any): SupportedLanguage {
  const candidate = (
    req?.query?.lang ||
    req?.body?.lang ||
    req?.body?.preferred_lang ||
    req?.tenant?.preferred_lang ||
    (req?.headers?.['accept-language']?.startsWith('fr') ? 'fr' : req?.headers?.['accept-language']?.startsWith('en') ? 'en' : 'es')
  );

  if (candidate === 'fr' || candidate === 'en' || candidate === 'es') {
    return candidate;
  }
  return 'es';
}

export function getMsg(key: string, lang: string = 'es', params?: Record<string, string>): string {
  const normLang: SupportedLanguage = (lang === 'fr' || lang === 'en') ? lang : 'es';
  const entry = BACKEND_MESSAGES[key];
  if (!entry) {
    return key;
  }
  let msg = entry[normLang] || entry.es || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return msg;
}

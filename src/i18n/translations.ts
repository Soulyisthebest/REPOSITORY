export type Language = 'es' | 'en' | 'fr';

export interface Translations {
  appName: string;
  tagline: string;
  verifiedBadge: string;
  passportTitle: string;
  scoreLabel: string;
  onTimePayments: string;
  onTimePunctuality: string;
  depositReturn: string;
  verifiedLandlords: string;
  leasesHistory: string;
  shareBtn: string;
  importContractBtn: string;
  addLeaseBtn: string;
  verifyNowBtn: string;
  pendingValidation: string;
  zeroIncidents: string;
  monthsCount: string;
  currentHome: string;
  quickVerifyTitle: string;
  quickVerifyDesc: string;
  q1Payment: string;
  q1Yes: string;
  q1No: string;
  q2Care: string;
  q3Deposit: string;
  q3Full: string;
  q3Partial: string;
  q4Recommend: string;
  q4Yes: string;
  q4No: string;
  commentOptional: string;
  certifyBtn: string;
  certifiedSuccess: string;
  seePassportBtn: string;
  inspectionTitle: string;
  contactBtn: string;
  certPdfBtn: string;
  backBtn: string;
  scanQr: string;
  copied: string;
  copy: string;
  modalAddTitle: string;
  addressLabel: string;
  cityLabel: string;
  rentLabel: string;
  landlordNameLabel: string;
  landlordContactLabel: string;
  sendInviteBtn: string;
  uploadDocHint: string;
  contractPhotoLabel: string;
  viewLandlord: string;
  viewPassport: string;
  viewCert: string;
  login: string;
  register: string;
  logout: string;
  myAccount: string;
  shareWhatsapp: string;
  shareEmail: string;
  dropContractFile: string;
  orClickToUpload: string;
  demoAccountBtn: string;
  authLoginSubtitle: string;
  authRegisterSubtitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  loginSuccessToast: string;
  logoutSuccessToast: string;
  leaseAddedToast: string;
  leaseDeletedToast: string;
  certifiedProofLock: string;
  codeLabel: string;
  inviteLandlordWhatsapp: string;
  inviteLandlordEmail: string;
  confirmAsLandlordBtn: string;
  startDateLabel: string;
  startDatePlaceholder: string;
  endDateLabel: string;
  endDatePlaceholder: string;
  analyzingWithGemini: string;
  analyzingSubtext: string;
  analysisSuccess: string;
  testSampleBtn: string;
  searchCodePlaceholder: string;
  searchCodeBtn: string;
  leaseNotFoundOrExpired: string;
  alreadyConfirmedError: string;
  certifiedSuccessTitle: string;
  certifiedSuccessDesc: string;
  shareWhatsappMessage: string;
  shareEmailSubject: string;
  inviteLandlordMessage: string;
  inviteLandlordEmailSubject: string;
  officialProtocol: string;
  digitalPassportLabel: string;
  perMonth: string;
  isRtl: boolean;
  privacyConsentLabel: string;
  viewPrivacyPolicyLink: string;
  privacyCenterBtn: string;
  downloadMyDataBtn: string;
  mustAcceptPrivacyError: string;
  optionalSmsVerificationToggle: string;
  optionalSmsDesc: string;
  sendSmsCodeBtn: string;
  verifySmsCodeBtn: string;
  smsCodePlaceholder: string;
  smsVerifiedSuccess: string;
  smsCodeSentToast: string;
  // Navigation & Swipe space keys
  navExplore: string;
  navPassport: string;
  navCertificate: string;
  activeAccount: string;
  noListingsTitle: string;
  noListingsDesc: string;
  publishFirstListingBtn: string;
  refreshListingsBtn: string;
  upToDateTitle: string;
  upToDateDesc: string;
  reviewListingsBtn: string;
  addAnotherListingBtn: string;
  availableListingsCount: string;
  publishListingBtn: string;
  searchingListings: string;
  seeDetailsHint: string;
  roomsCount: string;
  surface: string;
  furnished: string;
  unfurnished: string;
  availability: string;
  immediate: string;
  petsAllowed: string;
  petsForbidden: string;
  certifiedLandlord: string;
  directLandlord: string;
  closeDetails: string;
  likeAction: string;
  passAction: string;
  reciprocalMatchTitle: string;
  reciprocalMatchDesc: string;
  continueDiscoveryBtn: string;
  publishModalTitle: string;
  listingTitleLabel: string;
  listingTitlePlaceholder: string;
  neighborhoodLabel: string;
  neighborhoodPlaceholder: string;
  depositLabel: string;
  imageUrlLabel: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  publishingBtn: string;
  publishSuccessTitle: string;
  publishSuccessDesc: string;
  noLeasesTitle: string;
  noLeasesDesc: string;
  qrVerifiedTitle: string;
  qrVerifiedDesc: string;
  verifyLandlordBtn: string;
  simulatorBtn: string;
  closeBtn: string;
  // Rental Power Simulator Keys
  rentalPowerTitle: string;
  rentalPowerSubtitle: string;
  activeStatus: string;
  targetRent: string;
  perMonthSlash: string;
  fileRank: string;
  rankTop1: string;
  rankTop5: string;
  rankStandard: string;
  prioritySubtext: string;
  negotiableDeposit: string;
  depositSavedSubtext: string;
  orNoGuarantor: string;
  acceptanceRate: string;
  within24h: string;
  noFollowups: string;
  oneClickPitchTitle: string;
  oneClickPitchDesc: string;
  copyPitchBtn: string;
  pitchCopiedToast: string;
  // Crypto Proof Keys
  cryptoModalTag: string;
  cryptoModalTitle: string;
  cryptoModalSubtitle: string;
  immutabilityRuleTitle: string;
  immutabilityRuleText: string;
  sha256Label: string;
  certifiedPropertyLabel: string;
  certifiedSignerLabel: string;
  sealDateLabel: string;
  signMethodLabel: string;
  digitalSignature2fa: string;
  landlordTestimonyLabel: string;
  closeProofBtn: string;
  // Payment History Keys
  ledgerBadge: string;
  paymentsModalTitle: string;
  paymentsModalSubtitle: string;
  realPunctuality: string;
  onTimeBadge: string;
  totalCertifiedRent: string;
  noBankIncident: string;
  recordPaymentBtn: string;
  newPaymentTitle: string;
  cancelBtn: string;
  associatedLease: string;
  rentAmountLabel: string;
  dueDateLabel: string;
  savePaymentBtn: string;
  receiptHistoryTitle: string;
  onTimeCertifiedBadge: string;
  noPaymentsRecorded: string;
  // Add Lease & Document Extraction Keys
  addLeaseModalTitle: string;
  addLeaseModalSubtitle: string;
  cameraTriggerLabel: string;
  photosTriggerLabel: string;
  filesTriggerLabel: string;
  scannerSubtext: string;
  multiImagesSubtext: string;
  pdfDocsSubtext: string;
  pagesSelectedCount: string;
  addAnotherPageBtn: string;
  analyzePagesWithGemini: string;
  extractedReviewTitle: string;
  extractedReviewSubtitle: string;
  confidenceScoreLabel: string;
  restartBtn: string;
  confirmCreateLeaseBtn: string;
  creatingLeaseLoading: string;
  depositFieldLabel: string;
  // Privacy & GDPR Keys
  privacyCenterHeaderTitle: string;
  privacyCenterHeaderDesc: string;
  legalDraftDisclaimerTitle: string;
  legalDraftDisclaimerText: string;
  privacyPolicyTab: string;
  termsTab: string;
  gdprRightsTab: string;
  deleteAccountConfirmBtn: string;
  deleteAccountWarning: string;
  deleteAccountPermanentAction: string;
  exportDataSuccessToast: string;
  accountDeletedToast: string;
  immutableNoticeWormTitle: string;
  immutableNoticeWormDesc: string;
  noLeasesRegisteredTitle: string;
  noLeasesRegisteredDesc: string;
  verifyCryptoProofTitle: string;
  phoneAlreadyExistsError: string;
  guestUser: string;
  profileLoading: string;
  noActiveSessionDesc: string;
  // Post-Match Messaging Keys
  navMessages: string;
  chatModalTitle: string;
  chatModalSubtitle: string;
  waitingLandlordFirstMessage: string;
  waitingLandlordFirstMessageSubtext: string;
  landlordInitiatePrompt: string;
  landlordInitiatePromptSubtext: string;
  typeMessagePlaceholder: string;
  typeMessageWaitingPlaceholder: string;
  sendBtn: string;
  noMatchesYetTitle: string;
  noMatchesYetDesc: string;
  matchedOnListing: string;
  onlineStatus: string;
  openChatBtn: string;
  closeChatBtn: string;
  landlordTag: string;
  tenantTag: string;
  youTag: string;
  copyVerificationLink: string;
  linkCopied: string;
  shareCodeOrLinkNotice: string;
  landlordBlockedTitle: string;
  landlordBlockedDesc: string;
  logoutToVerifyBtn: string;
  backToPassportBtn: string;
  mandatorySmsTitle: string;
  mandatorySmsDesc: string;
  mandatorySmsBadge: string;
  smsMustVerifyFirst: string;
  smsVerifiedLandlordBadge: string;
  enterTestCodeHelper: string;
  fillTestCode: string;
  alreadyCertifiedSealedNotice: string;
  useDemoCodeBtn: string;
  codeRequiredToCertify: string;
  welcomeSlogan: string;
  getStartedBtn: string;
  alreadyHaveAccount: string;
  selectProfileTitle: string;
  selectProfileSubtitle: string;
  roleTenantTitle: string;
  roleTenantDesc: string;
  roleLandlordTitle: string;
  roleLandlordDesc: string;
  roleAgencyTitle: string;
  roleAgencyDesc: string;
  phoneRequiredError: string;
  phoneMandatoryBadge: string;
  navLandlordDashboard: string;
  navLandlordPublish: string;
  navLandlordSwipe: string;
  navLandlordVerify: string;
  roleBadgeTenant: string;
  roleBadgeLandlord: string;
  roleBadgeAgency: string;
  roleLockedNotice: string;
  // Landlord Dashboard & Andalusia Filter Keys
  landlordSubtitle: string;
  publishListingModalBtn: string;
  activeListingsCount: string;
  verifiedCandidatesCount: string;
  certifiedLeasesMetric: string;
  myListingsTab: string;
  availableCandidatesTab: string;
  filterListingsPlaceholder: string;
  filterCandidatesPlaceholder: string;
  loadingProperties: string;
  noListingsPublishedYet: string;
  noListingsPublishedYetDesc: string;
  createFirstListingBtn: string;
  perMonthSuffix: string;
  roomsSuffix: string;
  listingOnlineBadge: string;
  seeCandidatesBtn: string;
  searchingVerifiedProfiles: string;
  noCandidatesFound: string;
  noCandidatesFoundDesc: string;
  certifiedRentiaPassport: string;
  trustScoreTag: string;
  maxBudgetLabel: string;
  notSpecified: string;
  validatedLeasesCountLabel: string;
  certifiedLeasesHistoryCheck: string;
  proposeHousingBtn: string;
  contactRequestSentToast: string;
  contactRequestWaitingToast: string;
  allCitiesAndalusia: string;
  andalusiaOnlyBadge: string;
  geolocationBtn: string;
  locatingUser: string;
  geolocationErrorToast: string;
  closestCityToast: string;
  createListingLandlordOnlyError: string;
  propertyTypeApartment: string;
  propertyTypeHouse: string;
  navLandlordLikes: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    appName: 'Rentia',
    tagline: 'Pasaporte de reputación para inquilinos',
    welcomeSlogan: 'El pasaporte de alquiler verificado y la conexión transparente entre inquilinos y propietarios en España.',
    getStartedBtn: 'Empezar inscripción',
    alreadyHaveAccount: '¿Ya tienes cuenta? Iniciar sesión',
    selectProfileTitle: 'Elige tu tipo de perfil',
    selectProfileSubtitle: 'Selección obligatoria y exclusiva para acceder a tu espacio dedicado',
    roleTenantTitle: 'Soy inquilino',
    roleTenantDesc: 'Certifica tu historial de pagos, obtén tu pasaporte de confianza y encuentra piso sin avales abusivos.',
    roleLandlordTitle: 'Soy propietario privado',
    roleLandlordDesc: 'Publica tus viviendas particulares, selecciona candidatos certificados con pagos verificados y valida contratos en 30 segundos.',
    roleAgencyTitle: 'Soy agencia inmobiliaria',
    roleAgencyDesc: 'Gestión profesional de cartera de inmuebles, publicación, verificación de candidatos con pasaporte certificado y selección ágil.',
    phoneRequiredError: 'El número de teléfono es obligatorio.',
    phoneMandatoryBadge: 'Obligatorio (1 número = 1 cuenta)',
    navLandlordDashboard: 'Mis Anuncios',
    navLandlordPublish: 'Publicar anuncio',
    navLandlordSwipe: 'Candidatos',
    navLandlordLikes: 'Perfiles Favoritos',
    navLandlordVerify: 'Validar contrato',
    roleBadgeTenant: 'Inquilino',
    roleBadgeLandlord: 'Propietario',
    roleBadgeAgency: 'Agencia Inmobiliaria',
    roleLockedNotice: 'Perfil fijo e intransferible',
    verifiedBadge: 'Verificado',
    passportTitle: 'Pasaporte de Inquilino',
    scoreLabel: 'Reputación',
    onTimePayments: 'Pagos al día',
    onTimePunctuality: 'Puntualidad en pagos',
    depositReturn: 'Fianzas devueltas',
    verifiedLandlords: 'Caseros verificados',
    leasesHistory: 'Historial de alquileres',
    shareBtn: 'Compartir',
    importContractBtn: 'Importar contrato',
    addLeaseBtn: 'Añadir alquiler',
    verifyNowBtn: 'Validar (30s)',
    pendingValidation: 'Pendiente de validación',
    zeroIncidents: '0 incidencias',
    monthsCount: 'meses',
    currentHome: 'Vivienda actual',
    quickVerifyTitle: 'Confirmar Inquilino',
    quickVerifyDesc: '3 clics para certificar el historial de alquiler del inquilino.',
    q1Payment: '¿El inquilino pagó el alquiler puntualmente cada mes?',
    q1Yes: 'Sí, siempre puntual',
    q1No: 'No, hubo retrasos',
    q2Care: '¿Cuidó la vivienda y respetó las normas de convivencia?',
    q3Deposit: '¿La fianza fue devuelta íntegramente al finalizar el contrato?',
    q3Full: 'Sí, devuelta 100%',
    q3Partial: 'No, deducción o retención',
    q4Recommend: '¿Recomendarías este inquilino a otro propietario?',
    q4Yes: 'Totalmente',
    q4No: 'No',
    commentOptional: 'Comentario opcional sobre el comportamiento',
    certifyBtn: 'Certificar y firmar digitalmente',
    certifiedSuccess: '¡Alquiler certificado con éxito!',
    seePassportBtn: 'Ver pasaporte público',
    inspectionTitle: 'Inspección de Pasaporte Rentia',
    contactBtn: 'Contactar inquilino',
    certPdfBtn: 'Descargar certificado del inquilino (PDF)',
    backBtn: 'Volver',
    scanQr: 'Escanear para verificar',
    copied: '¡Copiado!',
    copy: 'Copiar enlace',
    modalAddTitle: 'Añadir una vivienda a tu pasaporte',
    addressLabel: 'Dirección de la vivienda',
    cityLabel: 'Ciudad',
    rentLabel: 'Alquiler mensual (€)',
    landlordNameLabel: 'Nombre del propietario o agencia',
    landlordContactLabel: 'Email o WhatsApp del propietario',
    sendInviteBtn: 'Enviar solicitud de validación',
    uploadDocHint: 'O sube una foto de tu contrato para rellenar los datos automáticamente con IA',
    contractPhotoLabel: 'Foto del contrato de arrendamiento',
    viewLandlord: 'Modo Propietario',
    viewPassport: 'Mi Pasaporte',
    viewCert: 'Certificado',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    logout: 'Cerrar sesión',
    myAccount: 'Mi cuenta',
    shareWhatsapp: 'Compartir por WhatsApp',
    shareEmail: 'Compartir por Email',
    dropContractFile: 'Arrastra tu contrato aquí (PDF, JPG, PNG)',
    orClickToUpload: 'o haz clic para seleccionar un archivo',
    demoAccountBtn: 'Crear cuenta con mis datos',
    authLoginSubtitle: 'Accede a tu pasaporte de inquilino verificado',
    authRegisterSubtitle: 'Crea tu cuenta y empieza a certificar tus alquileres',
    fullNameLabel: 'Nombre completo',
    fullNamePlaceholder: 'Ej: Carlos Mendoza Gómez',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'carlos@ejemplo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres (Mayús, minús, núm, símbolo)',
    phoneLabel: 'Número de teléfono',
    phonePlaceholder: '+34 600 000 000',
    loginSuccessToast: 'Sesión iniciada correctamente',
    logoutSuccessToast: 'Sesión cerrada',
    leaseAddedToast: 'Alquiler añadido con éxito',
    leaseDeletedToast: 'Alquiler eliminado',
    certifiedProofLock: 'Prueba criptográfica inmutable verificada en ledger seguro',
    codeLabel: 'Código de validación',
    inviteLandlordWhatsapp: 'Invitar por WhatsApp',
    inviteLandlordEmail: 'Invitar por Email',
    confirmAsLandlordBtn: 'Confirmar como propietario',
    startDateLabel: 'Fecha de inicio',
    startDatePlaceholder: 'AAAA-MM',
    endDateLabel: 'Fecha de fin (o "Actual")',
    endDatePlaceholder: 'AAAA-MM o Actual',
    analyzingWithGemini: 'Analizando contrato con IA Gemini...',
    analyzingSubtext: 'Extrayendo dirección, fechas, renta y partes contratantes',
    analysisSuccess: 'Datos extraídos con éxito del contrato',
    testSampleBtn: 'Rellenar con datos de prueba',
    searchCodePlaceholder: 'Introduce el código (ej: VAL784)',
    searchCodeBtn: 'Buscar alquiler',
    leaseNotFoundOrExpired: 'Alquiler no encontrado o código incorrecto.',
    alreadyConfirmedError: 'Este alquiler ya ha sido validado y certificado anteriormente.',
    certifiedSuccessTitle: '¡Certificación completada con éxito!',
    certifiedSuccessDesc: 'El historial de este inquilino ha quedado certificado de forma verificada e inmutable.',
    shareWhatsappMessage: 'Hola, aquí tienes mi Pasaporte de Inquilino Rentia con mi historial verificado:',
    shareEmailSubject: 'Pasaporte de Inquilino Rentia verificado',
    inviteLandlordMessage: 'Hola, te agradezco si puedes confirmar mi alquiler en Rentia para mi pasaporte:',
    inviteLandlordEmailSubject: 'Solicitud de confirmación de alquiler Rentia',
    officialProtocol: 'Protocolo de Verificación Inmobiliaria Certificada',
    digitalPassportLabel: 'PASAPORTE DIGITAL DE INQUILINO',
    perMonth: 'mes',
    isRtl: false,
    privacyConsentLabel: 'Acepto el tratamiento de mis datos según el RGPD y la Política de Privacidad de Rentia',
    viewPrivacyPolicyLink: 'Ver Política de Privacidad',
    privacyCenterBtn: 'Centro de Privacidad y RGPD',
    downloadMyDataBtn: 'Exportar mis datos (JSON)',
    mustAcceptPrivacyError: 'Debes aceptar la política de privacidad para continuar.',
    optionalSmsVerificationToggle: 'Verificación por SMS',
    optionalSmsDesc: 'Añade una capa de seguridad verificando tu teléfono.',
    sendSmsCodeBtn: 'Enviar código SMS',
    verifySmsCodeBtn: 'Verificar código',
    smsCodePlaceholder: 'Introduce el código de 6 dígitos',
    smsVerifiedSuccess: 'Teléfono verificado por SMS con éxito',
    smsCodeSentToast: 'Código SMS enviado',
    navExplore: 'Explorar',
    navPassport: 'Mi Pasaporte & QR',
    navCertificate: 'Certificado',
    activeAccount: 'Cuenta activa',
    noListingsTitle: 'Ningún inmueble disponible por ahora en Málaga',
    noListingsDesc: 'La base de datos no contiene anuncios ficticios. Puedes publicar el primer inmueble real como propietario o esperar a que se añada uno.',
    publishFirstListingBtn: 'Crear el primer anuncio (Propietario)',
    refreshListingsBtn: 'Actualizar inmuebles',
    upToDateTitle: '¡Estás al día!',
    upToDateDesc: 'Has consultado todos los inmuebles actualmente disponibles en Málaga.',
    reviewListingsBtn: 'Revisar inmuebles',
    addAnotherListingBtn: 'Añadir otro inmueble',
    availableListingsCount: 'Inmuebles disponibles',
    publishListingBtn: 'Publicar inmueble',
    searchingListings: 'Comprobando inmuebles reales certificados...',
    seeDetailsHint: 'Ver detalles y propietario certificado',
    roomsCount: 'estancias',
    surface: 'Superficie',
    furnished: 'Amueblado',
    unfurnished: 'Sin amueblar',
    availability: 'Disponibilidad',
    immediate: 'Inmediata',
    petsAllowed: 'Mascotas permitidas',
    petsForbidden: 'Sin mascotas',
    certifiedLandlord: 'Propietario certificado',
    directLandlord: 'Directo',
    closeDetails: 'Cerrar detalles',
    likeAction: 'Me gusta',
    passAction: 'Pasar',
    reciprocalMatchTitle: 'Interés recíproco confirmado',
    reciprocalMatchDesc: 'El propietario y tú habéis confirmado vuestro interés. Tu Pasaporte certificado ha sido validado.',
    continueDiscoveryBtn: 'Continuar explorando',
    publishModalTitle: 'Publicar un inmueble real (Propietario)',
    listingTitleLabel: 'Título del anuncio',
    listingTitlePlaceholder: 'Ej: Apartamento luminoso Calle Larios',
    neighborhoodLabel: 'Barrio',
    neighborhoodPlaceholder: 'Ej: Soho / Centro',
    depositLabel: 'Fianza (€)',
    imageUrlLabel: 'URL de la foto',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: 'Detalles del inmueble, equipamiento...',
    publishingBtn: 'Publicando...',
    publishSuccessTitle: '¡Inmueble publicado con éxito!',
    publishSuccessDesc: 'Ya es visible en tiempo real en la pantalla de exploración.',
    noLeasesTitle: 'Sin alquileres registrados por ahora',
    noLeasesDesc: 'Añade tu primer contrato o vivienda actual para construir tu reputación certificada.',
    qrVerifiedTitle: 'Código QR de Verificación',
    qrVerifiedDesc: 'Muestra este código QR a un propietario o agencia para certificar al instante tus referencias.',
    verifyLandlordBtn: 'Verificar propietario',
    simulatorBtn: 'Simulador',
    closeBtn: 'Cerrar',
    // Rental Power Simulator Keys
    rentalPowerTitle: 'Poder de Alquiler y Ventajas Inmediatas',
    rentalPowerSubtitle: 'Convierte tu puntuación Rentia en ventajas y ahorros concretos',
    activeStatus: 'Activo',
    targetRent: 'Alquiler mensual objetivo',
    perMonthSlash: '€ / mes',
    fileRank: 'Posición de Candidatura',
    rankTop1: 'Top 1% (#1 de 40)',
    rankTop5: 'Top 5% (#2 de 40)',
    rankStandard: 'Estándar',
    prioritySubtext: 'Prioridad sobre el 99% de candidaturas',
    negotiableDeposit: 'Fianza Negociable',
    depositSavedSubtext: 'de ahorro estimado',
    orNoGuarantor: 'O exención de avalista',
    acceptanceRate: 'Tasa de Aceptación',
    within24h: 'en 24h',
    noFollowups: 'Sin esperas ni llamadas',
    oneClickPitchTitle: 'Mensaje de Candidatura 1-Clic',
    oneClickPitchDesc: 'Copia el mensaje listo para enviar a propietarios y agencias',
    copyPitchBtn: 'Copiar mensaje',
    pitchCopiedToast: '¡Texto copiado!',
    // Crypto Proof Keys
    cryptoModalTag: 'Certificado Inalterable (WORM)',
    cryptoModalTitle: 'Prueba Criptográfica de Autenticidad',
    cryptoModalSubtitle: 'Protocolo antifalsificación sellado tras la firma',
    immutabilityRuleTitle: 'Regla de Inmutabilidad Absoluta',
    immutabilityRuleText: 'Conforme a las reglas del protocolo Rentia, una vez validada por el propietario, esta certificación no puede ser modificada, falsificada ni eliminada.',
    sha256Label: 'Huella digital SHA-256 :',
    certifiedPropertyLabel: 'Inmueble certificado :',
    certifiedSignerLabel: 'Firmante certificado :',
    sealDateLabel: 'Fecha de sellado :',
    signMethodLabel: 'Método de firma :',
    digitalSignature2fa: 'Firma Digital 2FA',
    landlordTestimonyLabel: 'Testimonio del propietario certificado :',
    closeProofBtn: 'Cerrar prueba',
    // Payment History Keys
    ledgerBadge: 'Libro Mayor de Alquileres',
    paymentsModalTitle: 'Historial de Pagos de Alquiler',
    paymentsModalSubtitle: 'Cada mensualidad pagada a tiempo acredita tu puntuación de puntualidad en el pasaporte.',
    realPunctuality: 'Puntualidad real',
    onTimeBadge: '100% a tiempo',
    totalCertifiedRent: 'Total alquileres certificados',
    noBankIncident: 'Sin incidencias bancarias',
    recordPaymentBtn: 'Registrar recibo o pago',
    newPaymentTitle: 'Nuevo pago',
    cancelBtn: 'Cancelar',
    associatedLease: 'Alquiler asociado',
    rentAmountLabel: 'Importe del alquiler',
    dueDateLabel: 'Fecha de pago',
    savePaymentBtn: 'Guardar pago',
    receiptHistoryTitle: 'Historial de recibos certificados',
    onTimeCertifiedBadge: 'Pago puntual certificado',
    noPaymentsRecorded: 'Ningún pago registrado por el momento',
    // Add Lease & Document Extraction Keys
    addLeaseModalTitle: 'Importar tu contrato de alquiler',
    addLeaseModalSubtitle: 'Sube tu contrato (PDF o fotos). Gemini extraerá automáticamente los datos.',
    cameraTriggerLabel: 'Cámara',
    photosTriggerLabel: 'Galería',
    filesTriggerLabel: 'Archivos',
    scannerSubtext: 'Escanear',
    multiImagesSubtext: 'Multi-fotos',
    pdfDocsSubtext: 'PDF y Docs',
    pagesSelectedCount: 'Páginas añadidas',
    addAnotherPageBtn: 'Añadir página',
    analyzePagesWithGemini: 'Analizar con Gemini',
    extractedReviewTitle: 'Información extraída del contrato',
    extractedReviewSubtitle: 'Verifica y corrige los datos antes de confirmar.',
    confidenceScoreLabel: 'precisión',
    restartBtn: 'Volver',
    confirmCreateLeaseBtn: 'Confirmar y añadir alquiler',
    creatingLeaseLoading: 'Creando alquiler...',
    depositFieldLabel: 'Fianza',
    // Privacy & GDPR Keys
    privacyCenterHeaderTitle: 'Centro de Privacidad y RGPD',
    privacyCenterHeaderDesc: 'Transparencia total sobre la protección y control de tus datos personales.',
    legalDraftDisclaimerTitle: 'Borrador informativo',
    legalDraftDisclaimerText: 'Este documento refleja los principios de confidencialidad y tratamiento aplicados en la plataforma.',
    privacyPolicyTab: 'Política de Privacidad',
    termsTab: 'Términos y Condiciones',
    gdprRightsTab: 'Tus Derechos RGPD',
    deleteAccountConfirmBtn: 'Eliminar mi cuenta y datos',
    deleteAccountWarning: 'Esta acción borrará definitivamente tu pasaporte y referencias.',
    deleteAccountPermanentAction: 'Confirmar eliminación definitiva',
    exportDataSuccessToast: 'Datos exportados en formato JSON',
    accountDeletedToast: 'Cuenta eliminada correctamente',
    immutableNoticeWormTitle: 'Dictamen inmutable y sellado (WORM):',
    immutableNoticeWormDesc: 'Al validar, tus respuestas quedarán selladas mediante huella criptográfica. Conforme al protocolo de confianza Rentia, no podrás modificarlas tras su registro.',
    noLeasesRegisteredTitle: 'Ningún alquiler registrado por el momento',
    noLeasesRegisteredDesc: 'Añade tu primer contrato de arrendamiento o tu vivienda actual para empezar a construir tu reputación de alquiler certificada.',
    verifyCryptoProofTitle: 'Verificar prueba criptográfica SHA-256',
    phoneAlreadyExistsError: 'Este número de teléfono ya está asociado a otra cuenta.',
    guestUser: 'Usuario invitado',
    profileLoading: 'Cargando perfil...',
    noActiveSessionDesc: 'Inicia sesión para gestionar y certificar tu pasaporte.',
    // Post-Match Messaging Keys
    navMessages: 'Mensajes',
    chatModalTitle: 'Mensajes y Conversaciones',
    chatModalSubtitle: 'Conversación directa verificada y segura',
    waitingLandlordFirstMessage: 'En espera del primer mensaje del propietario',
    waitingLandlordFirstMessageSubtext: 'Por norma de la plataforma, el propietario debe iniciar la conversación. Podrás responder en cuanto te escriba.',
    landlordInitiatePrompt: '¡Tienes una coincidencia mutua! Inicia la conversación',
    landlordInitiatePromptSubtext: 'Como propietario, debes enviar el primer mensaje para abrir el chat con el inquilino.',
    typeMessagePlaceholder: 'Escribe tu mensaje...',
    typeMessageWaitingPlaceholder: 'En espera del primer mensaje del casero...',
    sendBtn: 'Enviar',
    noMatchesYetTitle: 'Sin conversaciones activas',
    noMatchesYetDesc: 'Cuando coincidas con un propietario o inquilino en la sección Explorar, la conversación aparecerá aquí.',
    matchedOnListing: 'Inmueble :',
    onlineStatus: 'En línea',
    openChatBtn: 'Abrir chat',
    closeChatBtn: 'Cerrar chat',
    landlordTag: 'Propietario',
    tenantTag: 'Inquilino',
    youTag: 'Tú',
    copyVerificationLink: 'Copiar enlace de validación',
    linkCopied: '¡Enlace copiado!',
    shareCodeOrLinkNotice: 'Comparte este código o enlace con tu propietario. Solo el propietario puede certificar el alquiler.',
    landlordBlockedTitle: 'Sesión activa de inquilino detectada',
    landlordBlockedDesc: 'Por motivos de seguridad y prevención de fraudes, no puedes certificar un alquiler mientras estés conectado como inquilino. Cierra la sesión o abre el enlace en una ventana privada.',
    logoutToVerifyBtn: 'Cerrar sesión para certificar',
    backToPassportBtn: 'Volver a mi pasaporte',
    mandatorySmsTitle: 'Verificación por SMS del propietario (Obligatoria)',
    mandatorySmsDesc: 'Para garantizar la autenticidad y prevenir el fraude, debes verificar tu número de teléfono móvil antes de certificar.',
    mandatorySmsBadge: 'PASO OBLIGATORIO',
    smsMustVerifyFirst: 'Debes verificar tu número de teléfono por SMS para poder certificar la propiedad.',
    smsVerifiedLandlordBadge: 'Teléfono verificado ✓',
    enterTestCodeHelper: 'Código de prueba SMS :',
    fillTestCode: 'Rellenar código',
    alreadyCertifiedSealedNotice: 'Esta propiedad ya ha sido validada y sellada con éxito. No es necesario volver a certificarla.',
    useDemoCodeBtn: 'Probar con código de ejemplo',
    codeRequiredToCertify: 'Por favor, introduce y busca un código de alquiler válido antes de certificar.',
    landlordSubtitle: 'Espacio Propietario • Gestión de viviendas y selección de candidatos certificados',
    publishListingModalBtn: 'Publicar un anuncio',
    activeListingsCount: 'Anuncios activos',
    verifiedCandidatesCount: 'Candidatos verificados',
    certifiedLeasesMetric: 'Alquileres certificados',
    myListingsTab: 'Mis Viviendas',
    availableCandidatesTab: 'Candidatos Disponibles',
    filterListingsPlaceholder: 'Filtrar por título o ciudad...',
    filterCandidatesPlaceholder: 'Filtrar por nombre...',
    loadingProperties: 'Cargando viviendas...',
    noListingsPublishedYet: 'Ninguna vivienda publicada por ahora',
    noListingsPublishedYetDesc: 'Publica tu primera vivienda en Andalucía para recibir solicitudes de inquilinos certificados.',
    createFirstListingBtn: 'Crear anuncio',
    perMonthSuffix: 'mes',
    roomsSuffix: 'habitaciones',
    listingOnlineBadge: 'En línea',
    seeCandidatesBtn: 'Ver candidatos →',
    searchingVerifiedProfiles: 'Buscando perfiles verificados...',
    noCandidatesFound: 'Ningún candidato encontrado',
    noCandidatesFoundDesc: 'Los perfiles de inquilinos certificados aparecerán aquí.',
    certifiedRentiaPassport: 'Pasaporte Rentia Certificado',
    trustScoreTag: 'Puntuación',
    maxBudgetLabel: 'Presupuesto máx',
    notSpecified: 'No especificado',
    validatedLeasesCountLabel: 'Alquileres validados',
    certifiedLeasesHistoryCheck: 'Historial de alquiler y puntualidad de pagos validados',
    proposeHousingBtn: 'Proponer una vivienda',
    contactRequestSentToast: '¡Solicitud de contacto enviada! En espera de confirmación recíproca.',
    contactRequestWaitingToast: 'Solicitud enviada • En espera de la confirmación del inquilino',
    allCitiesAndalusia: 'Toda Andalucía (8 provincias)',
    andalusiaOnlyBadge: 'Solo Andalucía',
    geolocationBtn: 'Activar ubicación',
    locatingUser: 'Geolocalizando...',
    geolocationErrorToast: 'No se pudo obtener la ubicación. Selecciona tu ciudad manualmente.',
    closestCityToast: 'Ciudad detectada en Andalucía:',
    createListingLandlordOnlyError: 'Solo los propietarios verificados pueden publicar un anuncio.',
    propertyTypeApartment: 'Piso / Apartamento',
    propertyTypeHouse: 'Casa / Chalet',
  },
  en: {
    appName: 'Rentia',
    tagline: 'Verified reputation passport for tenants',
    welcomeSlogan: 'The verified rental passport and transparent connection between certified tenants and trusted landlords in Spain.',
    getStartedBtn: 'Get started',
    alreadyHaveAccount: 'Already have an account? Sign in',
    selectProfileTitle: 'Select your profile type',
    selectProfileSubtitle: 'Mandatory and exclusive selection to access your dedicated space',
    roleTenantTitle: 'I am a tenant',
    roleTenantDesc: 'Certify your payment history, build your trust score, and secure housing without excessive guarantees.',
    roleLandlordTitle: 'I am a private landlord',
    roleLandlordDesc: 'Publish your private properties, connect with verified candidates with certified rent track records, and validate leases in 30 seconds.',
    roleAgencyTitle: 'I am a real estate agency',
    roleAgencyDesc: 'Professional property portfolio management, publishing, vetted tenant matching with certified passports, and agile selection.',
    phoneRequiredError: 'Phone number is mandatory.',
    phoneMandatoryBadge: 'Mandatory (1 number = 1 account)',
    navLandlordDashboard: 'My Listings',
    navLandlordPublish: 'Publish listing',
    navLandlordSwipe: 'Candidates',
    navLandlordLikes: 'Liked Profiles',
    navLandlordVerify: 'Verify lease',
    roleBadgeTenant: 'Tenant',
    roleBadgeLandlord: 'Landlord',
    roleBadgeAgency: 'Real Estate Agency',
    roleLockedNotice: 'Exclusive and locked profile',
    verifiedBadge: 'Verified',
    passportTitle: 'Tenant Passport',
    scoreLabel: 'Reputation',
    onTimePayments: 'On-time payments',
    onTimePunctuality: 'On-time punctuality',
    depositReturn: 'Deposits returned',
    verifiedLandlords: 'Verified landlords',
    leasesHistory: 'Rental history',
    shareBtn: 'Share',
    importContractBtn: 'Import lease',
    addLeaseBtn: 'Add rental',
    verifyNowBtn: 'Verify (30s)',
    pendingValidation: 'Pending validation',
    zeroIncidents: '0 incidents',
    monthsCount: 'months',
    currentHome: 'Current home',
    quickVerifyTitle: 'Confirm Tenant',
    quickVerifyDesc: '3 clicks to certify the tenant rental history.',
    q1Payment: 'Did the tenant pay rent on time every month?',
    q1Yes: 'Yes, always punctual',
    q1No: 'No, there were delays',
    q2Care: 'Did they take good care of the home and respect rules?',
    q3Deposit: 'Was the deposit fully returned at lease end?',
    q3Full: 'Yes, 100% returned',
    q3Partial: 'No, deduction or withheld',
    q4Recommend: 'Would you recommend this tenant to another landlord?',
    q4Yes: 'Fully recommend',
    q4No: 'No',
    commentOptional: 'Optional feedback on tenant behavior',
    certifyBtn: 'Certify and digitally sign',
    certifiedSuccess: 'Rental successfully certified!',
    seePassportBtn: 'View public passport',
    inspectionTitle: 'Rentia Passport Inspection',
    contactBtn: 'Contact tenant',
    certPdfBtn: 'Download official certificate (PDF)',
    backBtn: 'Back',
    scanQr: 'Scan to verify',
    copied: 'Copied!',
    copy: 'Copy link',
    modalAddTitle: 'Add a home to your passport',
    addressLabel: 'Property address',
    cityLabel: 'City',
    rentLabel: 'Monthly rent (€)',
    landlordNameLabel: 'Landlord or agency name',
    landlordContactLabel: 'Landlord email or WhatsApp',
    sendInviteBtn: 'Send validation request',
    uploadDocHint: 'Or upload your lease agreement to extract details with AI',
    contractPhotoLabel: 'Lease agreement photo',
    viewLandlord: 'Landlord Mode',
    viewPassport: 'My Passport',
    viewCert: 'Certificate',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    myAccount: 'My account',
    shareWhatsapp: 'Share via WhatsApp',
    shareEmail: 'Share via Email',
    dropContractFile: 'Drop your lease file here (PDF, JPG, PNG)',
    orClickToUpload: 'or click to browse file',
    demoAccountBtn: 'Create account with my details',
    authLoginSubtitle: 'Access your verified tenant passport',
    authRegisterSubtitle: 'Create your account and start certifying rentals',
    fullNameLabel: 'Full name',
    fullNamePlaceholder: 'e.g., Alex Johnson',
    emailLabel: 'Email address',
    emailPlaceholder: 'alex@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Minimum 8 characters (Upper, lower, num, symbol)',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+34 600 000 000',
    loginSuccessToast: 'Successfully logged in',
    logoutSuccessToast: 'Successfully logged out',
    leaseAddedToast: 'Rental added successfully',
    leaseDeletedToast: 'Rental deleted',
    certifiedProofLock: 'Cryptographic proof verified on secure ledger',
    codeLabel: 'Validation code',
    inviteLandlordWhatsapp: 'Invite via WhatsApp',
    inviteLandlordEmail: 'Invite via Email',
    confirmAsLandlordBtn: 'Confirm as landlord',
    startDateLabel: 'Start date',
    startDatePlaceholder: 'YYYY-MM',
    endDateLabel: 'End date (or "Current")',
    endDatePlaceholder: 'YYYY-MM or Current',
    analyzingWithGemini: 'Analyzing lease with Gemini AI...',
    analyzingSubtext: 'Extracting address, dates, rent and parties',
    analysisSuccess: 'Data extracted successfully from lease',
    testSampleBtn: 'Fill with sample data',
    searchCodePlaceholder: 'Enter verification code (e.g. VAL784)',
    searchCodeBtn: 'Search rental',
    leaseNotFoundOrExpired: 'Rental not found or expired code.',
    alreadyConfirmedError: 'This rental has already been validated and certified.',
    certifiedSuccessTitle: 'Certification successfully completed!',
    certifiedSuccessDesc: 'This tenant rental history has been officially and immutably certified.',
    shareWhatsappMessage: 'Hi, here is my verified Rentia Tenant Passport:',
    shareEmailSubject: 'Verified Rentia Tenant Passport',
    inviteLandlordMessage: 'Hi, I would appreciate if you could confirm my rental on Rentia for my passport:',
    inviteLandlordEmailSubject: 'Rentia rental confirmation request',
    officialProtocol: 'Certified Real Estate Verification Protocol',
    digitalPassportLabel: 'DIGITAL TENANT PASSPORT',
    perMonth: 'mo',
    isRtl: false,
    privacyConsentLabel: 'I accept data processing under GDPR and Rentia Privacy Policy',
    viewPrivacyPolicyLink: 'View Privacy Policy',
    privacyCenterBtn: 'Privacy Center & GDPR',
    downloadMyDataBtn: 'Export my data (JSON)',
    mustAcceptPrivacyError: 'You must accept the privacy policy to continue.',
    optionalSmsVerificationToggle: 'SMS verification',
    optionalSmsDesc: 'Add a security layer by verifying your phone number.',
    sendSmsCodeBtn: 'Send SMS code',
    verifySmsCodeBtn: 'Verify code',
    smsCodePlaceholder: 'Enter 6-digit code',
    smsVerifiedSuccess: 'Phone number verified successfully via SMS',
    smsCodeSentToast: 'SMS code sent',
    navExplore: 'Explore',
    navPassport: 'My Passport & QR',
    navCertificate: 'Certificate',
    activeAccount: 'Active account',
    noListingsTitle: 'No listings available yet in Málaga',
    noListingsDesc: 'The database contains no mock listings. You can publish the first genuine property as a landlord or wait for new verified listings.',
    publishFirstListingBtn: 'Create the first listing (Landlord)',
    refreshListingsBtn: 'Refresh listings',
    upToDateTitle: 'You are all caught up!',
    upToDateDesc: 'You have viewed all verified listings currently available in Málaga.',
    reviewListingsBtn: 'Review listings',
    addAnotherListingBtn: 'Add another listing',
    availableListingsCount: 'Available listings',
    publishListingBtn: 'Publish listing',
    searchingListings: 'Checking verified real properties...',
    seeDetailsHint: 'View details & verified landlord',
    roomsCount: 'rooms',
    surface: 'Surface',
    furnished: 'Furnished',
    unfurnished: 'Unfurnished',
    availability: 'Availability',
    immediate: 'Immediate',
    petsAllowed: 'Pets allowed',
    petsForbidden: 'No pets',
    certifiedLandlord: 'Verified landlord',
    directLandlord: 'Direct',
    closeDetails: 'Close details',
    likeAction: 'Like',
    passAction: 'Pass',
    reciprocalMatchTitle: 'Mutual Match Confirmed',
    reciprocalMatchDesc: 'Both you and the landlord confirmed mutual interest. Your verified Passport is validated.',
    continueDiscoveryBtn: 'Continue discovery',
    publishModalTitle: 'Publish a real property (Landlord)',
    listingTitleLabel: 'Listing title',
    listingTitlePlaceholder: 'e.g., Bright 2-bedroom Calle Larios',
    neighborhoodLabel: 'Neighborhood',
    neighborhoodPlaceholder: 'e.g., Soho / Downtown',
    depositLabel: 'Deposit (€)',
    imageUrlLabel: 'Photo URL',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Property amenities, details...',
    publishingBtn: 'Publishing...',
    publishSuccessTitle: 'Property published successfully!',
    publishSuccessDesc: 'It is now visible in real-time on the discovery screen.',
    noLeasesTitle: 'No rentals registered yet',
    noLeasesDesc: 'Add your first lease agreement or current home to build your verified reputation.',
    qrVerifiedTitle: 'Official Verification QR Code',
    qrVerifiedDesc: 'Present this QR code to a landlord or agency to instantly certify your rental track record.',
    verifyLandlordBtn: 'Verify landlord',
    simulatorBtn: 'Simulator',
    closeBtn: 'Close',
    // Rental Power Simulator Keys
    rentalPowerTitle: 'Rental Power & Immediate Advantages',
    rentalPowerSubtitle: 'Convert your Rentia score into concrete savings and perks',
    activeStatus: 'Active',
    targetRent: 'Target monthly rent',
    perMonthSlash: '€ / mo',
    fileRank: 'Application Ranking',
    rankTop1: 'Top 1% (#1 out of 40)',
    rankTop5: 'Top 5% (#2 out of 40)',
    rankStandard: 'Standard',
    prioritySubtext: 'Priority over 99% of applications',
    negotiableDeposit: 'Negotiable Deposit',
    depositSavedSubtext: 'estimated savings',
    orNoGuarantor: 'Or guarantor waiver',
    acceptanceRate: 'Acceptance Rate',
    within24h: 'within 24h',
    noFollowups: 'Without endless follow-ups',
    oneClickPitchTitle: '1-Click Application Pitch',
    oneClickPitchDesc: 'Copy the ready-to-send message for landlords and agencies',
    copyPitchBtn: 'Copy pitch',
    pitchCopiedToast: 'Text copied!',
    // Crypto Proof Keys
    cryptoModalTag: 'Unalterable Certificate (WORM)',
    cryptoModalTitle: 'Cryptographic Proof of Authenticity',
    cryptoModalSubtitle: 'Anti-tampering protocol sealed upon signature',
    immutabilityRuleTitle: 'Absolute Immutability Rule',
    immutabilityRuleText: 'According to Rentia protocol rules, once validated by the landlord, this certificate cannot be modified, forged, or deleted.',
    sha256Label: 'SHA-256 Digital Fingerprint :',
    certifiedPropertyLabel: 'Certified property :',
    certifiedSignerLabel: 'Certified signatory :',
    sealDateLabel: 'Sealing date :',
    signMethodLabel: 'Signature method :',
    digitalSignature2fa: '2FA Digital Signature',
    landlordTestimonyLabel: 'Testimony from certified landlord :',
    closeProofBtn: 'Close proof',
    // Payment History Keys
    ledgerBadge: 'Rent Payment Ledger',
    paymentsModalTitle: 'Rent Payment History',
    paymentsModalSubtitle: 'Each on-time payment directly fuels your 100% verified punctuality score.',
    realPunctuality: 'Real punctuality',
    onTimeBadge: '100% on due date',
    totalCertifiedRent: 'Total certified rent',
    noBankIncident: 'Zero banking incidents',
    recordPaymentBtn: 'Record receipt or payment',
    newPaymentTitle: 'New payment',
    cancelBtn: 'Cancel',
    associatedLease: 'Associated lease',
    rentAmountLabel: 'Rent amount',
    dueDateLabel: 'Due date',
    savePaymentBtn: 'Save payment',
    receiptHistoryTitle: 'Certified receipts history',
    onTimeCertifiedBadge: 'Certified on-time payment',
    noPaymentsRecorded: 'No payments recorded yet',
    // Add Lease & Document Extraction Keys
    addLeaseModalTitle: 'Import your lease agreement',
    addLeaseModalSubtitle: 'Upload your contract (PDF or photos). Gemini will extract information automatically.',
    cameraTriggerLabel: 'Camera',
    photosTriggerLabel: 'Gallery',
    filesTriggerLabel: 'Files',
    scannerSubtext: 'Scan',
    multiImagesSubtext: 'Multi-photos',
    pdfDocsSubtext: 'PDF & Docs',
    pagesSelectedCount: 'Added pages',
    addAnotherPageBtn: 'Add a page',
    analyzePagesWithGemini: 'Analyze with Gemini',
    extractedReviewTitle: 'Extracted lease information',
    extractedReviewSubtitle: 'Review and correct details before confirming.',
    confidenceScoreLabel: 'confidence',
    restartBtn: 'Start over',
    confirmCreateLeaseBtn: 'Confirm & create rental',
    creatingLeaseLoading: 'Creating rental...',
    depositFieldLabel: 'Deposit',
    // Privacy & GDPR Keys
    privacyCenterHeaderTitle: 'Privacy Center & GDPR',
    privacyCenterHeaderDesc: 'Complete transparency on the protection and control of your personal data.',
    legalDraftDisclaimerTitle: 'Informational draft',
    legalDraftDisclaimerText: 'This document reflects the confidentiality principles applied on the platform.',
    privacyPolicyTab: 'Privacy Policy',
    termsTab: 'Terms of Service',
    gdprRightsTab: 'Your GDPR Rights',
    deleteAccountConfirmBtn: 'Delete my account and data',
    deleteAccountWarning: 'This action will permanently remove your passport and all references.',
    deleteAccountPermanentAction: 'Confirm permanent deletion',
    exportDataSuccessToast: 'Data exported as JSON format',
    accountDeletedToast: 'Account successfully deleted',
    immutableNoticeWormTitle: 'Immutable and sealed record (WORM):',
    immutableNoticeWormDesc: 'Upon confirmation, your answers will be sealed by cryptographic hash. Under Rentia trust protocol, you cannot modify them once registered.',
    noLeasesRegisteredTitle: 'No rentals registered yet',
    noLeasesRegisteredDesc: 'Add your first lease agreement or current home to start building your certified rental reputation.',
    verifyCryptoProofTitle: 'Verify SHA-256 cryptographic proof',
    phoneAlreadyExistsError: 'This phone number is already associated with another account.',
    guestUser: 'Guest user',
    profileLoading: 'Loading profile...',
    noActiveSessionDesc: 'Log in to manage and certify your rental passport.',
    // Post-Match Messaging Keys
    navMessages: 'Messages',
    chatModalTitle: 'Post-Match Messaging',
    chatModalSubtitle: 'Verified and secure direct conversation',
    waitingLandlordFirstMessage: 'Awaiting landlord first message',
    waitingLandlordFirstMessageSubtext: 'By platform rules, the landlord must initiate the conversation. You can reply as soon as they write.',
    landlordInitiatePrompt: 'You have a mutual match! Start the conversation',
    landlordInitiatePromptSubtext: 'As the landlord, you must send the first message to open the chat with the tenant.',
    typeMessagePlaceholder: 'Type your message...',
    typeMessageWaitingPlaceholder: 'Waiting for landlord to send first message...',
    sendBtn: 'Send',
    noMatchesYetTitle: 'No active conversations',
    noMatchesYetDesc: 'When you match with a landlord or tenant in the Explore tab, conversations will appear here.',
    matchedOnListing: 'Property :',
    onlineStatus: 'Online',
    openChatBtn: 'Open chat',
    closeChatBtn: 'Close chat',
    landlordTag: 'Landlord',
    tenantTag: 'Tenant',
    youTag: 'You',
    copyVerificationLink: 'Copy validation link',
    linkCopied: 'Link copied!',
    shareCodeOrLinkNotice: 'Share this code or link with your landlord. Only the landlord can certify your lease.',
    landlordBlockedTitle: 'Active tenant session detected',
    landlordBlockedDesc: 'For security and fraud prevention, you cannot certify a lease while logged in as a tenant. Please log out or open this link in an incognito window.',
    logoutToVerifyBtn: 'Log out to certify',
    backToPassportBtn: 'Back to passport',
    mandatorySmsTitle: 'Landlord SMS Verification (Required)',
    mandatorySmsDesc: 'To guarantee authenticity and prevent fraud, you must verify your mobile phone number before certifying.',
    mandatorySmsBadge: 'REQUIRED STEP',
    smsMustVerifyFirst: 'You must verify your phone number via SMS before certifying this rental.',
    smsVerifiedLandlordBadge: 'Phone verified ✓',
    enterTestCodeHelper: 'Test SMS code:',
    fillTestCode: 'Fill code',
    alreadyCertifiedSealedNotice: 'This rental has already been validated and sealed successfully. No further certification is required.',
    useDemoCodeBtn: 'Test with sample code',
    codeRequiredToCertify: 'Please enter and search a valid lease code before certifying.',
    landlordSubtitle: 'Landlord Portal • Property management & selection of certified tenants',
    publishListingModalBtn: 'Publish a listing',
    activeListingsCount: 'Active listings',
    verifiedCandidatesCount: 'Verified candidates',
    certifiedLeasesMetric: 'Certified leases',
    myListingsTab: 'My Listings',
    availableCandidatesTab: 'Available Candidates',
    filterListingsPlaceholder: 'Filter by title or city...',
    filterCandidatesPlaceholder: 'Filter by name...',
    loadingProperties: 'Loading properties...',
    noListingsPublishedYet: 'No listings published yet',
    noListingsPublishedYetDesc: 'Publish your first property in Andalusia to receive applications from certified tenants.',
    createFirstListingBtn: 'Create listing',
    perMonthSuffix: 'month',
    roomsSuffix: 'rooms',
    listingOnlineBadge: 'Online',
    seeCandidatesBtn: 'View candidates →',
    searchingVerifiedProfiles: 'Searching verified profiles...',
    noCandidatesFound: 'No candidates matching',
    noCandidatesFoundDesc: 'Certified tenant profiles will appear here.',
    certifiedRentiaPassport: 'Certified Rentia Passport',
    trustScoreTag: 'Score',
    maxBudgetLabel: 'Max budget',
    notSpecified: 'Not specified',
    validatedLeasesCountLabel: 'Validated leases',
    certifiedLeasesHistoryCheck: 'Rental history and on-time rent punctuality validated',
    proposeHousingBtn: 'Propose a listing',
    contactRequestSentToast: 'Contact request sent! Awaiting reciprocal confirmation.',
    contactRequestWaitingToast: 'Request sent • Awaiting tenant reciprocal confirmation',
    allCitiesAndalusia: 'All Andalusia (8 provinces)',
    andalusiaOnlyBadge: 'Andalusia Only',
    geolocationBtn: 'Use location',
    locatingUser: 'Locating...',
    geolocationErrorToast: 'Could not access location. Please select your city manually.',
    closestCityToast: 'Closest city in Andalusia detected:',
    createListingLandlordOnlyError: 'Only verified landlords can publish a listing.',
    propertyTypeApartment: 'Apartment / Flat',
    propertyTypeHouse: 'House / Villa',
  },
  fr: {
    appName: 'Rentia',
    tagline: 'Passeport de réputation pour locataires',
    welcomeSlogan: 'Le passeport locatif certifié et la mise en relation transparente entre locataires vérifiés et propriétaires de confiance en Espagne.',
    getStartedBtn: 'Commencer',
    alreadyHaveAccount: 'Déjà un compte ? Se connecter',
    selectProfileTitle: 'Choisissez votre type de profil',
    selectProfileSubtitle: 'Sélection obligatoire et exclusive pour accéder à votre espace dédié',
    roleTenantTitle: 'Je suis locataire',
    roleTenantDesc: 'Certifiez vos paiements passés, créez votre passeport infalsifiable et trouvez votre logement sans garant abusif.',
    roleLandlordTitle: 'Je suis propriétaire privé',
    roleLandlordDesc: 'Publiez vos biens particuliers, sélectionnez des candidats certifiés aux paiements vérifiés et validez vos baux en 30 secondes.',
    roleAgencyTitle: 'Je suis une agence immobilière',
    roleAgencyDesc: 'Gestion professionnelle de portefeuille, publication, vérification des candidats avec passeport certifié et sélection rapide.',
    phoneRequiredError: 'Le numéro de téléphone est obligatoire.',
    phoneMandatoryBadge: 'Obligatoire (1 numéro = 1 compte)',
    navLandlordDashboard: 'Mes Annonces',
    navLandlordPublish: 'Publier une annonce',
    navLandlordSwipe: 'Candidats',
    navLandlordLikes: 'Profils Likés',
    navLandlordVerify: 'Vérifier un bail',
    roleBadgeTenant: 'Locataire',
    roleBadgeLandlord: 'Propriétaire',
    roleBadgeAgency: 'Agence Immobilière',
    roleLockedNotice: 'Profil exclusif et non modifiable',
    verifiedBadge: 'Vérifié',
    passportTitle: 'Passeport Locataire',
    scoreLabel: 'Réputation',
    onTimePayments: 'Paiements ponctuels',
    onTimePunctuality: 'Ponctualité réelle',
    depositReturn: 'Cautions restituées',
    verifiedLandlords: 'Bailleurs vérifiés',
    leasesHistory: 'Historique des locations',
    shareBtn: 'Partager',
    importContractBtn: 'Importer un bail',
    addLeaseBtn: 'Ajouter une location',
    verifyNowBtn: 'Valider (30s)',
    pendingValidation: 'En attente de validation',
    zeroIncidents: '0 litige',
    monthsCount: 'mois',
    currentHome: 'Logement actuel',
    quickVerifyTitle: 'Confirmer le Locataire',
    quickVerifyDesc: '3 clics pour certifier l\'historique locatif du locataire.',
    q1Payment: 'Le locataire a-t-il payé son loyer à temps chaque mois ?',
    q1Yes: 'Oui, toujours ponctuel',
    q1No: 'Non, retards constatés',
    q2Care: 'A-t-il pris soin du logement et respecté les règles ?',
    q3Deposit: 'La caution a-t-elle été intégralement restituée à la fin ?',
    q3Full: 'Oui, restituée à 100%',
    q3Partial: 'Non, retenue effectuée',
    q4Recommend: 'Recommanderiez-vous ce locataire à un autre bailleur ?',
    q4Yes: 'Totalement',
    q4No: 'Non',
    commentOptional: 'Commentaire facultatif sur le locataire',
    certifyBtn: 'Certifier et signer numériquement',
    certifiedSuccess: 'Location certifiée avec succès !',
    seePassportBtn: 'Voir le passeport public',
    inspectionTitle: 'Inspection du Passeport Rentia',
    contactBtn: 'Contacter le locataire',
    certPdfBtn: 'Télécharger le certificat officiel (PDF)',
    backBtn: 'Retour',
    scanQr: 'Scanner pour vérifier',
    copied: 'Copié !',
    copy: 'Copier le lien',
    modalAddTitle: 'Ajouter un logement à votre passeport',
    addressLabel: 'Adresse du logement',
    cityLabel: 'Ville',
    rentLabel: 'Loyer mensuel (€)',
    landlordNameLabel: 'Nom du propriétaire ou agence',
    landlordContactLabel: 'Email ou WhatsApp du propriétaire',
    sendInviteBtn: 'Envoyer la demande de validation',
    uploadDocHint: 'Ou importez une photo de votre contrat pour remplir les informations par IA',
    contractPhotoLabel: 'Photo du contrat de bail',
    viewLandlord: 'Mode Bailleur',
    viewPassport: 'Mon Passeport',
    viewCert: 'Certificat',
    login: 'Connexion',
    register: 'Créer un compte',
    logout: 'Déconnexion',
    myAccount: 'Mon compte',
    shareWhatsapp: 'Partager sur WhatsApp',
    shareEmail: 'Partager par Email',
    dropContractFile: 'Glissez votre contrat ici (PDF, JPG, PNG)',
    orClickToUpload: 'ou cliquez pour parcourir vos fichiers',
    demoAccountBtn: 'Créer un compte avec mes coordonnées',
    authLoginSubtitle: 'Accédez à votre passeport locataire certifié',
    authRegisterSubtitle: 'Créez votre compte et certifiez vos locations',
    fullNameLabel: 'Nom complet',
    fullNamePlaceholder: 'Ex : Claire Dubois',
    emailLabel: 'Adresse email',
    emailPlaceholder: 'claire@exemple.com',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: '8 caractères minimum (Maj, min, chiffre, symbole)',
    phoneLabel: 'Numéro de téléphone',
    phonePlaceholder: '+33 6 00 00 00 00',
    loginSuccessToast: 'Connexion réussie',
    logoutSuccessToast: 'Déconnexion effectuée',
    leaseAddedToast: 'Location ajoutée avec succès',
    leaseDeletedToast: 'Location supprimée',
    certifiedProofLock: 'Preuve cryptographique vérifiée sur registre sécurisé',
    codeLabel: 'Code de validation',
    inviteLandlordWhatsapp: 'Inviter par WhatsApp',
    inviteLandlordEmail: 'Inviter par Email',
    confirmAsLandlordBtn: 'Confirmer en tant que propriétaire',
    startDateLabel: 'Date d\'entrée',
    startDatePlaceholder: 'AAAA-MM',
    endDateLabel: 'Date de sortie (ou "Actuel")',
    endDatePlaceholder: 'AAAA-MM ou Actuel',
    analyzingWithGemini: 'Analyse du contrat par l\'IA Gemini...',
    analyzingSubtext: 'Extraction de l\'adresse, des dates, du loyer et des parties',
    analysisSuccess: 'Informations extraites du contrat avec succès',
    testSampleBtn: 'Remplir avec des données d\'exemple',
    searchCodePlaceholder: 'Entrez le code (ex : VAL784)',
    searchCodeBtn: 'Rechercher la location',
    leaseNotFoundOrExpired: 'Location introuvable ou code expiré.',
    alreadyConfirmedError: 'Cette location a déjà été validée et certifiée.',
    certifiedSuccessTitle: 'Certification finalisée avec succès !',
    certifiedSuccessDesc: 'L\'historique de ce locataire est désormais officiellement certifié de façon immuable.',
    shareWhatsappMessage: 'Bonjour, voici mon Passeport Locataire Rentia vérifié :',
    shareEmailSubject: 'Passeport Locataire Rentia vérifié',
    inviteLandlordMessage: 'Bonjour, pourriez-vous confirmer ma location sur Rentia pour mon passeport :',
    inviteLandlordEmailSubject: 'Demande de confirmation de location Rentia',
    officialProtocol: 'Protocole de Vérification Immobilière Certifiée',
    digitalPassportLabel: 'PASSEPORT DIGITAL DU LOCATAIRE',
    perMonth: 'mois',
    isRtl: false,
    privacyConsentLabel: 'J\'accepte le traitement de mes données selon le RGPD et la politique Rentia',
    viewPrivacyPolicyLink: 'Consulter la politique de confidentialité',
    privacyCenterBtn: 'Centre de Confidentialité & RGPD',
    downloadMyDataBtn: 'Exporter mes données (JSON)',
    mustAcceptPrivacyError: 'Vous devez accepter la politique de confidentialité pour continuer.',
    optionalSmsVerificationToggle: 'Vérification par SMS',
    optionalSmsDesc: 'Ajoutez une sécurité en vérifiant votre numéro de téléphone.',
    sendSmsCodeBtn: 'Envoyer le code SMS',
    verifySmsCodeBtn: 'Vérifier le code',
    smsCodePlaceholder: 'Entrez le code à 6 chiffres',
    smsVerifiedSuccess: 'Numéro de téléphone vérifié par SMS avec succès',
    smsCodeSentToast: 'Code SMS envoyé',
    navExplore: 'Explorer',
    navPassport: 'Mon Passeport & QR',
    navCertificate: 'Certificat',
    activeAccount: 'Compte actif',
    noListingsTitle: 'Aucun logement disponible pour le moment à Málaga',
    noListingsDesc: 'La base de données ne contient aucune annonce fictive. Vous pouvez publier la première annonce réelle en tant que propriétaire ou attendre qu\'un bien compatible soit ajouté.',
    publishFirstListingBtn: 'Créer la première annonce (Propriétaire)',
    refreshListingsBtn: 'Actualiser les logements',
    upToDateTitle: 'Vous êtes à jour !',
    upToDateDesc: 'Tous les logements actuellement disponibles à Málaga ont été consultés.',
    reviewListingsBtn: 'Revoir les logements',
    addAnotherListingBtn: 'Ajouter une autre annonce',
    availableListingsCount: 'Logements disponibles',
    publishListingBtn: 'Publier un logement',
    searchingListings: 'Vérification des logements réels certifiés...',
    seeDetailsHint: 'Voir les détails et le bailleur certifié',
    roomsCount: 'pièces',
    surface: 'Surface',
    furnished: 'Meublé',
    unfurnished: 'Non meublé',
    availability: 'Disponibilité',
    immediate: 'Immédiate',
    petsAllowed: 'Animaux acceptés',
    petsForbidden: 'Non admis',
    certifiedLandlord: 'Bailleur certifié',
    directLandlord: 'Direct',
    closeDetails: 'Fermer les détails',
    likeAction: 'J\'aime',
    passAction: 'Passer',
    reciprocalMatchTitle: 'Intérêt Réciproque Confirmé',
    reciprocalMatchDesc: 'Le bailleur et vous-même avez confirmé votre intérêt. Votre Passeport certifié a été validé.',
    continueDiscoveryBtn: 'Continuer la découverte',
    publishModalTitle: 'Publier un logement réel (Propriétaire)',
    listingTitleLabel: 'Titre de l\'annonce',
    listingTitlePlaceholder: 'Ex : Superbe T2 lumineux Calle Larios',
    neighborhoodLabel: 'Quartier',
    neighborhoodPlaceholder: 'Ex : Soho / Centre',
    depositLabel: 'Caution (€)',
    imageUrlLabel: 'URL de la photo',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Détails du bien, équipements...',
    publishingBtn: 'Publication en cours...',
    publishSuccessTitle: 'Annonce publiée avec succès !',
    publishSuccessDesc: 'Elle est maintenant visible en temps réel dans l\'écran d\'exploration.',
    noLeasesTitle: 'Aucune location enregistrée pour le moment',
    noLeasesDesc: 'Ajoutez votre premier contrat de bail ou votre logement actuel pour commencer à bâtir votre réputation certifiée.',
    qrVerifiedTitle: 'QR Code Officiel de Vérification',
    qrVerifiedDesc: 'Présentez ce QR code à un bailleur ou agence pour certifier instantanément vos antécédents locatifs.',
    verifyLandlordBtn: 'Vérifier un bailleur',
    simulatorBtn: 'Simulateur',
    closeBtn: 'Fermer',
    // Rental Power Simulator Keys
    rentalPowerTitle: 'Pouvoir Locatif & Avantages Immédiats',
    rentalPowerSubtitle: 'Convertissez votre score Rentia en économies et avantages concrets',
    activeStatus: 'Actif',
    targetRent: 'Loyer mensuel ciblé',
    perMonthSlash: '€ / mois',
    fileRank: 'Classement Dossier',
    rankTop1: 'Top 1% (#1 sur 40)',
    rankTop5: 'Top 5% (#2 sur 40)',
    rankStandard: 'Standard',
    prioritySubtext: 'Passe avant 99% des dossiers',
    negotiableDeposit: 'Caution Négociable',
    depositSavedSubtext: 'd\'économie estimée',
    orNoGuarantor: 'Ou dispense de garant',
    acceptanceRate: 'Taux d\'Acceptation',
    within24h: 'sous 24h',
    noFollowups: 'Sans relances inutiles',
    oneClickPitchTitle: 'Accroche Candidature 1-Clic',
    oneClickPitchDesc: 'Copiez le message prêt à l\'emploi pour propriétaires et agences',
    copyPitchBtn: 'Copier l\'accroche',
    pitchCopiedToast: 'Texte copié !',
    // Crypto Proof Keys
    cryptoModalTag: 'Certificat Inaltérable (WORM)',
    cryptoModalTitle: 'Preuve Cryptographique d\'Authenticité',
    cryptoModalSubtitle: 'Protocole anti-falsification scellé dès la signature',
    immutabilityRuleTitle: 'Règle d\'Immuabilité Absolue',
    immutabilityRuleText: 'Conformément aux règles du protocole Rentia, une fois validée par le propriétaire, cette attestation ne peut plus être ni modifiée, ni falsifiée, ni supprimée.',
    sha256Label: 'Empreinte numérique SHA-256 :',
    certifiedPropertyLabel: 'Logement certifié :',
    certifiedSignerLabel: 'Signataire certifié :',
    sealDateLabel: 'Date de scellement :',
    signMethodLabel: 'Méthode de signature :',
    digitalSignature2fa: 'Signature Digitale 2FA',
    landlordTestimonyLabel: 'Témoignage du propriétaire certifié :',
    closeProofBtn: 'Fermer la preuve',
    // Payment History Keys
    ledgerBadge: 'Grand Livre des Loyers',
    paymentsModalTitle: 'Historique des Paiements de Loyer',
    paymentsModalSubtitle: 'Chaque échéance réglée à temps alimente directement votre score de ponctualité 100% vérifié.',
    realPunctuality: 'Ponctualité réelle',
    onTimeBadge: '100% à l\'échéance',
    totalCertifiedRent: 'Total loyers certifiés',
    noBankIncident: 'Sans incident bancaire',
    recordPaymentBtn: 'Enregistrer une quittance ou un paiement',
    newPaymentTitle: 'Nouveau paiement',
    cancelBtn: 'Annuler',
    associatedLease: 'Bail associé',
    rentAmountLabel: 'Montant du loyer',
    dueDateLabel: 'Date d\'échéance',
    savePaymentBtn: 'Enregistrer le paiement',
    receiptHistoryTitle: 'Historique des quittances certifiées',
    onTimeCertifiedBadge: 'Paiement ponctuel certifié',
    noPaymentsRecorded: 'Aucun paiement enregistré pour le moment',
    // Add Lease & Document Extraction Keys
    addLeaseModalTitle: 'Importer votre contrat de location',
    addLeaseModalSubtitle: 'Importez votre contrat (PDF ou photos). Gemini extraira automatiquement les informations.',
    cameraTriggerLabel: 'Caméra',
    photosTriggerLabel: 'Photos',
    filesTriggerLabel: 'Fichiers',
    scannerSubtext: 'Scanner',
    multiImagesSubtext: 'Multi-photos',
    pdfDocsSubtext: 'PDF & Docs',
    pagesSelectedCount: 'Pages ajoutées',
    addAnotherPageBtn: 'Ajouter une page',
    analyzePagesWithGemini: 'Analyser avec Gemini',
    extractedReviewTitle: 'Informations extraites du contrat',
    extractedReviewSubtitle: 'Vérifiez et corrigez les informations avant de confirmer.',
    confidenceScoreLabel: 'certitude',
    restartBtn: 'Recommencer',
    confirmCreateLeaseBtn: 'Confirmer & Créer la location',
    creatingLeaseLoading: 'Création en cours...',
    depositFieldLabel: 'Dépôt de garantie',
    // Privacy & GDPR Keys
    privacyCenterHeaderTitle: 'Centre de Confidentialité & RGPD',
    privacyCenterHeaderDesc: 'Transparence totale sur la protection et le contrôle de vos données personnelles.',
    legalDraftDisclaimerTitle: 'Brouillon informatif',
    legalDraftDisclaimerText: 'Ce document reflète les principes de confidentialité et de traitement appliqués sur la plateforme.',
    privacyPolicyTab: 'Politique de Confidentialité',
    termsTab: 'Conditions d\'Utilisation',
    gdprRightsTab: 'Vos Droits RGPD',
    deleteAccountConfirmBtn: 'Supprimer mon compte et mes données',
    deleteAccountWarning: 'Cette action supprimera définitivement votre passeport et toutes vos attestations.',
    deleteAccountPermanentAction: 'Confirmer la suppression définitive',
    exportDataSuccessToast: 'Données exportées au format JSON',
    accountDeletedToast: 'Compte supprimé avec succès',
    immutableNoticeWormTitle: 'Avis immuable et scellé (WORM) :',
    immutableNoticeWormDesc: 'En validant, vos réponses seront scellées par empreinte cryptographique. Conformément au protocole de confiance Rentia, vous n\'aurez pas le droit de les modifier après enregistrement.',
    noLeasesRegisteredTitle: 'Aucune location enregistrée pour le moment',
    noLeasesRegisteredDesc: 'Ajoutez votre premier contrat de bail ou votre logement actuel pour commencer à bâtir votre réputation locative certifiée.',
    verifyCryptoProofTitle: 'Vérifier la preuve cryptographique SHA-256',
    phoneAlreadyExistsError: 'Ce numéro de téléphone est déjà associé à un autre compte.',
    guestUser: 'Utilisateur invité',
    profileLoading: 'Chargement du profil...',
    noActiveSessionDesc: 'Connectez-vous pour gérer et certifier votre passeport locatif.',
    // Post-Match Messaging Keys
    navMessages: 'Messagerie',
    chatModalTitle: 'Messagerie Post-Match',
    chatModalSubtitle: 'Conversation directe vérifiée et sécurisée',
    waitingLandlordFirstMessage: 'En attente du premier message du propriétaire',
    waitingLandlordFirstMessageSubtext: 'Par règle de la plateforme, le propriétaire doit initier la conversation. Vous pourrez répondre dès qu\'il vous aura écrit.',
    landlordInitiatePrompt: 'Vous avez un match réciproque ! Initiez la conversation',
    landlordInitiatePromptSubtext: 'En tant que propriétaire, vous devez envoyer le premier message pour ouvrir le canal avec le locataire.',
    typeMessagePlaceholder: 'Écrivez votre message...',
    typeMessageWaitingPlaceholder: 'En attente du premier message du propriétaire...',
    sendBtn: 'Envoyer',
    noMatchesYetTitle: 'Aucune conversation active',
    noMatchesYetDesc: 'Dès qu\'un match bilatéral est confirmé dans l\'onglet Explorer, la discussion apparaîtra ici.',
    matchedOnListing: 'Logement :',
    onlineStatus: 'En ligne',
    openChatBtn: 'Ouvrir la discussion',
    closeChatBtn: 'Fermer la discussion',
    landlordTag: 'Propriétaire',
    tenantTag: 'Locataire',
    youTag: 'Vous',
    copyVerificationLink: 'Copier le lien de validation',
    linkCopied: 'Lien copié !',
    shareCodeOrLinkNotice: 'Partagez ce code ou ce lien avec votre bailleur. Seul le propriétaire peut certifier votre location.',
    landlordBlockedTitle: 'Session locataire active détectée',
    landlordBlockedDesc: 'Pour des raisons de sécurité et de prévention des fraudes, vous ne pouvez pas valider une location en étant connecté en tant que locataire. Veuillez vous déconnecter ou ouvrir ce lien en navigation privée.',
    logoutToVerifyBtn: 'Se déconnecter pour certifier',
    backToPassportBtn: 'Retour à mon passeport',
    mandatorySmsTitle: 'Vérification SMS du propriétaire (Obligatoire)',
    mandatorySmsDesc: 'Pour garantir l\'authenticité et prévenir la fraude, vous devez vérifier votre numéro de mobile avant de certifier.',
    mandatorySmsBadge: 'ÉTAPE OBLIGATOIRE',
    smsMustVerifyFirst: 'Vous devez vérifier votre numéro de téléphone par SMS pour pouvoir certifier cette location.',
    smsVerifiedLandlordBadge: 'Téléphone vérifié ✓',
    enterTestCodeHelper: 'Code de test SMS :',
    fillTestCode: 'Remplir le code',
    alreadyCertifiedSealedNotice: 'Cette location a déjà été validée et scellée avec succès. Aucune nouvelle certification n\'est nécessaire.',
    useDemoCodeBtn: 'Tester avec un code exemple',
    codeRequiredToCertify: 'Veuillez saisir et rechercher un code de bail valide avant de certifier.',
    landlordSubtitle: 'Espace Bailleur • Gestion des biens & sélection des candidats certifiés',
    publishListingModalBtn: 'Publier une annonce',
    activeListingsCount: 'Annonces actives',
    verifiedCandidatesCount: 'Candidats vérifiés',
    certifiedLeasesMetric: 'Baux certifiés',
    myListingsTab: 'Mes Logements',
    availableCandidatesTab: 'Candidats Disponibles',
    filterListingsPlaceholder: 'Filtrer par titre ou ville...',
    filterCandidatesPlaceholder: 'Filtrer par prénom...',
    loadingProperties: 'Chargement des biens...',
    noListingsPublishedYet: 'Aucun logement publié pour l\'instant',
    noListingsPublishedYetDesc: 'Publiez votre premier appartement en Andalousie pour recevoir les candidatures de locataires certifiés.',
    createFirstListingBtn: 'Créer une annonce',
    perMonthSuffix: 'mois',
    roomsSuffix: 'pièces',
    listingOnlineBadge: 'En ligne',
    seeCandidatesBtn: 'Voir candidats →',
    searchingVerifiedProfiles: 'Recherche des profils vérifiés...',
    noCandidatesFound: 'Aucun candidat correspondant',
    noCandidatesFoundDesc: 'Les profils de locataires certifiés apparaîtront ici.',
    certifiedRentiaPassport: 'Passeport Rentia Certifié',
    trustScoreTag: 'Score',
    maxBudgetLabel: 'Budget max',
    notSpecified: 'Non renseigné',
    validatedLeasesCountLabel: 'Baux validés',
    certifiedLeasesHistoryCheck: 'Historique locatif et ponctualité des loyers validés',
    proposeHousingBtn: 'Proposer un logement',
    contactRequestSentToast: 'Demande de contact envoyée ! En attente de réciprocité.',
    contactRequestWaitingToast: 'Demande envoyée • En attente de la confirmation du locataire',
    allCitiesAndalusia: 'Toute l\'Andalousie (8 provinces)',
    andalusiaOnlyBadge: 'Andalousie Uniquement',
    geolocationBtn: 'Activer localisation',
    locatingUser: 'Localisation en cours...',
    geolocationErrorToast: 'Impossible d\'obtenir votre position. Veuillez sélectionner votre ville manuellement.',
    closestCityToast: 'Ville détectée en Andalousie :',
    createListingLandlordOnlyError: 'Seuls les propriétaires vérifiés peuvent publier une annonce.',
    propertyTypeApartment: 'Appartement',
    propertyTypeHouse: 'Maison',
  }
};

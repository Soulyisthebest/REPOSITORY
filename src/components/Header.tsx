import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  QrCode, 
  FileText, 
  LogIn, 
  LogOut,
  ChevronDown,
  Globe,
  MessageSquare,
  KeyRound,
  Building2,
  Home,
  UserX,
  Heart,
  ShieldAlert,
  Map,
  FileCheck2,
  PlusCircle
} from 'lucide-react';
import { ViewMode, UserRole } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  onNavigate?: (view: ViewMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAddModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenPrivacy?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  currentUser: { id?: string; email: string; name?: string; role?: UserRole } | null;
  onLogout: () => void;
  onOpenDeleteAccountModal?: () => void;
  pendingCount?: number;
  onOpenScanContract?: () => void;
  tenantName?: string;
  onEnterAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNavigate,
  language,
  onLanguageChange,
  onOpenAuthModal,
  onOpenLogin,
  onOpenRegister,
  currentUser,
  onLogout,
  onOpenDeleteAccountModal,
  onEnterAdmin,
}) => {
  const t = TRANSLATIONS[language];
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navigateView = (view: ViewMode) => {
    if (typeof onViewChange === 'function') {
      onViewChange(view);
    } else if (typeof onNavigate === 'function') {
      onNavigate(view);
    }
  };

  const isAgency = currentUser?.role === 'agency';
  const isLandlord = currentUser?.role === 'landlord' || isAgency;

  // 3 Authorized languages
  const availableLanguages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO & BRAND */}
        <div 
          onClick={() => navigateView(isLandlord ? 'landlord_dashboard' : 'tenant_passport')}
          className="flex items-center gap-2 cursor-pointer select-none"
          id="logo-brand"
        >
          <div className="w-8 h-8 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#1E1B4B] block leading-none">
              RENTIA
            </span>
            <span className="text-[9px] font-bold text-stone-400 tracking-wider uppercase">
              {isAgency
                ? (language === 'es' ? 'Portal Agencia Inmobiliaria' : language === 'en' ? 'Agency Portal' : 'Espace Agence')
                : isLandlord 
                ? (language === 'es' ? 'Portal Propietario Privado' : language === 'en' ? 'Landlord Portal' : 'Espace Bailleur') 
                : (language === 'es' ? 'Pasaporte Digital' : language === 'en' ? 'Digital Passport' : 'Passeport Digital')}
            </span>
          </div>
        </div>

        {/* CENTER ROLE-AWARE NAVIGATION (Solo tras iniciar sesión) */}
        {currentUser && (
          <nav className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200/80 shadow-xs">
          
          {/* LANDLORD TABS (Strictly isolated: no tenant screens) */}
          {isLandlord ? (
            <>
              {/* Tab 1: Landlord Dashboard & Listings */}
              <button
                onClick={() => navigateView('landlord_dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'landlord_dashboard'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-landlord-dashboard"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.navLandlordDashboard}</span>
              </button>

              {/* Tab 2: Publicar Anuncio (Apartado exclusivo al lado de Anuncios) */}
              <button
                onClick={() => navigateView('landlord_publish')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'landlord_publish'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-landlord-publish"
              >
                <PlusCircle className={`w-3.5 h-3.5 ${currentView === 'landlord_publish' ? 'text-[#D97706]' : 'text-amber-600'}`} />
                <span>{t.navLandlordPublish}</span>
              </button>

              {/* Tab 3: Landlord Swipe (Candidatos Swipe) */}
              <button
                onClick={() => navigateView('landlord_swipe')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'landlord_swipe'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-landlord-swipe"
              >
                <Sparkles className={`w-3.5 h-3.5 ${currentView === 'landlord_swipe' ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{t.navLandlordSwipe}</span>
              </button>

              {/* Tab 3: Perfiles con Like (Landlord Likes) */}
              <button
                onClick={() => navigateView('landlord_likes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'landlord_likes'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-landlord-likes"
              >
                <Heart className={`w-3.5 h-3.5 ${currentView === 'landlord_likes' ? 'fill-rose-400 text-rose-400' : 'text-rose-500'}`} />
                <span>{t.navLandlordLikes}</span>
              </button>

              {/* Tab 4: Landlord Chat */}
              <button
                onClick={() => navigateView('matches_chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'matches_chat'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-messages"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t.navMessages}</span>
              </button>

              {/* Tab 5: Mapa de Inmuebles en España (Con gestión 1-clic de estado para Propietarios y Agencias) */}
              <button
                onClick={() => navigateView('property_map_search')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'property_map_search' || currentView === 'idealista_map_search'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-landlord-map"
                title="Mapa interactivo de viviendas en España con gestión de estado"
              >
                <Map className="w-3.5 h-3.5 text-amber-500" />
                <span>Mapa</span>
              </button>
            </>
          ) : (
            /* TENANT TABS (Strictly isolated: no landlord management screens) */
            <>
              {/* Tab 1: Swipe Discovery */}
              <button
                onClick={() => navigateView('matching_discovery')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'matching_discovery'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-matching"
              >
                <Sparkles className={`w-3.5 h-3.5 ${currentView === 'matching_discovery' ? 'text-[#D97706]' : 'text-stone-400'}`} />
                <span>{t.navExplore}</span>
              </button>

              {/* Tab 2: Mapa (Provincias, Proximidad, Dibujo de zona) */}
              <button
                onClick={() => navigateView('property_map_search')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'property_map_search' || currentView === 'idealista_map_search'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-map"
              >
                <Map className="w-3.5 h-3.5 text-amber-500" />
                <span>Mapa</span>
              </button>

              {/* Tab 3: Mis Likes (Prioridad P2) */}
              <button
                onClick={() => navigateView('tenant_likes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'tenant_likes'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-my-likes"
              >
                <Heart className={`w-3.5 h-3.5 ${currentView === 'tenant_likes' ? 'text-rose-400 fill-rose-400' : 'text-stone-400'}`} />
                <span>{language === 'es' ? 'Mis Favoritos' : language === 'en' ? 'My Likes' : 'Mes Favoris'}</span>
              </button>

              {/* Tab 4: Post-Match Messages */}
              <button
                onClick={() => navigateView('matches_chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'matches_chat'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-messages"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t.navMessages}</span>
              </button>

              {/* Tab 5: Pasaporte y Certificado del Inquilino Unificado (Juntos en una sola vista) */}
              <button
                onClick={() => navigateView('tenant_passport')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'tenant_passport'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
                }`}
                id="nav-tab-passport-certificate"
                title="Pasaporte digital y certificado del inquilino verificado"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Pasaporte y Certificado</span>
              </button>
            </>
          )}

        </nav>
        )}

        {/* RIGHT ACCOUNT & LANGUAGE CONTROLS */}
        <div className="flex items-center gap-2">
          {/* Admin Dashboards Suite Button - SOLO visible para rol de Administrador */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => navigateView('admin_panel')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                currentView === 'admin_panel'
                  ? 'bg-[#1E1B4B] text-white ring-2 ring-amber-400 shadow-sm'
                  : 'bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 hover:border-indigo-300'
              }`}
              id="btn-nav-admin-panel"
              title="Panel de Administración Rentia"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Panel Admin</span>
              <span className="md:hidden">Admin</span>
            </button>
          )}

          {/* 3-Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-1.5 text-stone-700 hover:text-[#1E1B4B] rounded-xl hover:bg-white transition-colors border border-stone-200/60 bg-white/70 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title={language === 'es' ? 'Cambiar idioma' : language === 'en' ? 'Change language' : 'Changer de langue'}
              id="btn-language-dropdown"
            >
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-scale-up">
                {availableLanguages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      onLanguageChange(item.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-stone-50 flex items-center justify-between transition-colors ${
                      language === item.code ? 'text-[#1E1B4B] font-bold bg-[#FAF9F6]' : 'text-stone-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-sm">{item.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Profile / Auth */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200/80 text-xs font-bold text-[#1E1B4B] hover:bg-stone-50 transition-colors shadow-2xs"
                id="btn-account-menu"
              >
                <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                  isLandlord ? 'bg-teal-600' : 'bg-[#1E1B4B]'
                }`}>
                  {(currentUser.name || currentUser.email).charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate text-xs font-bold">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isAgency
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : isLandlord
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {isAgency ? t.roleBadgeAgency : isLandlord ? t.roleBadgeLandlord : t.roleBadgeTenant}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-scale-up">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{t.activeAccount}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isAgency
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : isLandlord
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {isAgency ? t.roleBadgeAgency : isLandlord ? t.roleBadgeLandlord : t.roleBadgeTenant}
                      </span>
                    </div>
                    {currentUser.name && (
                      <p className="text-xs font-bold text-[#1E1B4B] truncate">{currentUser.name}</p>
                    )}
                    <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                  </div>

                  {/* Acceso a Panel Admin - Solo visible para Administradores */}
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigateView('admin_panel');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors border-b border-stone-100"
                      id="btn-admin-panel"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Panel de administración</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50 flex items-center gap-2 transition-colors"
                    id="btn-user-logout"
                  >
                    <LogOut className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.logout}</span>
                  </button>

                  {onOpenDeleteAccountModal && (
                    <>
                      <div className="border-t border-stone-100 my-1"></div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenDeleteAccountModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors rounded-b-xl"
                        id="btn-open-delete-account-modal"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{language === 'es' ? 'Eliminar mi cuenta' : language === 'en' ? 'Delete my account' : 'Supprimer mon compte'}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenRegister || onOpenAuthModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-bold transition-colors shadow-xs"
                id="btn-header-register"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Inscripción' : 'Inscription'}</span>
              </button>
              <button
                onClick={onOpenLogin || onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-colors shadow-xs"
                id="btn-open-auth"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D97706]" />
                <span>{t.login}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

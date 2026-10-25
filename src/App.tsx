import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WelcomeLanding } from './components/WelcomeLanding';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { LandlordDashboard } from './components/LandlordDashboard';
import { PublishListingView } from './components/PublishListingView';
import { PassportCard } from './components/PassportCard';
import { TrustStats } from './components/TrustStats';
import { RentalHistoryList } from './components/RentalHistoryList';
import { LandlordFastVerification } from './components/LandlordFastVerification';
import { PublicLandlordInspection } from './components/PublicLandlordInspection';
import { OfficialCertificatePrint } from './components/OfficialCertificatePrint';
import { UnifiedPassportAndCertificate } from './components/UnifiedPassportAndCertificate';
import { IdealistaMapSearch } from './components/IdealistaMapSearch';
import { NotificationPermissionModal } from './components/NotificationPermissionModal';
import { SwipeDiscovery } from './components/SwipeDiscovery';
import { LandlordSwipeDiscovery } from './components/LandlordSwipeDiscovery';
import { MatchesListView } from './components/MatchesListView';
import { TenantGamifiedOnboardingModal } from './components/TenantGamifiedOnboardingModal';
import { AddLeaseModal } from './components/AddLeaseModal';
import { SharePassportModal } from './components/SharePassportModal';
import { AuthModal } from './components/AuthModal';
import { PaymentHistoryModal } from './components/PaymentHistoryModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccessGate } from './components/admin/AdminAccessGate';
import { MyLikesView } from './components/MyLikesView';
import { LandlordLikesView } from './components/LandlordLikesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { INITIAL_TENANT, INITIAL_LEASES } from './data/mockData';
import { RentalLease, TenantProfile, ViewMode, UserRole } from './types';
import { Language, TRANSLATIONS } from './i18n/translations';
import { CheckCircle2, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { api, setAuthToken } from './api/client';
import { supabase } from './lib/supabase';
import { useSessionTracker } from './lib/useSessionTracker';

export default function App() {
  const [language, setLanguage] = useState<Language>('es'); // Default Spanish
  const [tenant, setTenant] = useState<TenantProfile>(() => {
    try {
      const stored = localStorage.getItem('rentia_tenant_photos');
      if (stored) {
        const photos = JSON.parse(stored);
        if (Array.isArray(photos) && photos.length > 0) {
          return {
            ...INITIAL_TENANT,
            photos,
            avatarUrl: photos[0] || INITIAL_TENANT.avatarUrl,
          };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_TENANT;
  });
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string; role?: UserRole } | null>(null);
  const [leases, setLeases] = useState<RentalLease[]>(INITIAL_LEASES);

  // Automated user session & time-in-app tracking (active vs idle time, heartbeats, page changes)
  useSessionTracker(currentUser?.id, currentUser?.email);

  const [currentView, setCurrentView] = useState<ViewMode>('matching_discovery');
  const [hasDeepLink, setHasDeepLink] = useState(false);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [authSelectedRole, setAuthSelectedRole] = useState<UserRole>('tenant');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  const [isTenantQuizOpen, setIsTenantQuizOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  // Update HTML dir (RTL/LTR) and lang whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = t.isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, t.isRtl]);

  // Deep Link URL detection on app mount (?code=VAL784, ?inspect=1, ?view=cert)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('validate');
      const inspectParam = params.get('inspect') || params.get('public');
      const viewParam = params.get('view');

      if (codeParam || viewParam === 'verify') {
        setHasDeepLink(true);
        setCurrentView('landlord_verify_flow');
      } else if (inspectParam === '1' || viewParam === 'landlord' || viewParam === 'public') {
        setHasDeepLink(true);
        setCurrentView('landlord_public_view');
      } else if (viewParam === 'cert' || viewParam === 'certificate') {
        setHasDeepLink(true);
        setCurrentView('certificate_export');
      }
    }
  }, []);

  // Fetch tenant and leases from live backend API
  const refreshBackendData = useCallback(async () => {
    try {
      // Guard: If admin mode is active or view is admin_panel, keep admin identity intact
      const isAdminActive = localStorage.getItem('rentia_admin_mode') === 'true' || currentView === 'admin_panel' || currentUser?.role === 'admin';

      if (!isAdminActive) {
        // 1. Check current logged-in user profile from Supabase session
        let meRes;
        try {
          meRes = await api.tenant.getMe();
        } catch {
          // No active session: set unauthenticated state honestly
          setCurrentUser(null);
          setTenant(INITIAL_TENANT);
        }

        if (meRes?.tenant) {
          const tData = meRes.tenant;
          const assignedRole: UserRole = tData.role === 'admin' ? 'admin' : (tData.role === 'landlord' ? 'landlord' : (tData.role === 'agency' ? 'agency' : 'tenant'));

          setCurrentUser({
            id: tData.id,
            email: tData.email || '',
            name: tData.name || '',
            role: assignedRole,
          });

          // If user is landlord, agency or admin, automatically route to the appropriate view
          if (assignedRole === 'admin') {
            setCurrentView(prev => (prev === 'admin_panel' ? 'admin_panel' : prev));
          } else if (assignedRole === 'landlord' || assignedRole === 'agency') {
            setCurrentView(prev => (prev === 'tenant_passport' || prev === 'matching_discovery' || prev === 'certificate_export' ? 'landlord_swipe' : prev));
          } else {
            setCurrentView(prev => (prev === 'tenant_passport' || prev === 'certificate_export' ? 'matching_discovery' : prev));
            const isQuizDone = localStorage.getItem('rentia_tenant_quiz_completed_current') === 'true' || 
                               localStorage.getItem(`rentia_tenant_quiz_completed_${tData.id}`) === 'true' ||
                               Boolean(tData.onboarding_completed || tData.onboardingCompleted);
            if (!isQuizDone) {
              setIsTenantQuizOpen(true);
            }
          }

          const storedPhotos = localStorage.getItem('rentia_tenant_photos');
          let parsedPhotos: string[] = [];
          try {
            if (storedPhotos) parsedPhotos = JSON.parse(storedPhotos);
          } catch {
            // ignore
          }

          setTenant(prev => {
            const finalPhotos = (tData.photos && tData.photos.length > 0)
              ? tData.photos
              : (parsedPhotos.length > 0 ? parsedPhotos : (prev.photos || []));

            return {
              ...prev,
              id: tData.id,
              role: assignedRole,
              passportId: tData.id ? `RNTA-${tData.id.substring(0, 4).toUpperCase()}` : '',
              passportNumber: tData.id ? `RNTA-ES-${tData.id.substring(0, 4).toUpperCase()}` : '',
              fullName: tData.name || '',
              email: tData.email || '',
              phone: tData.phone || '',
              avatarUrl: tData.avatar_url || (finalPhotos[0] || prev.avatarUrl),
              photos: finalPhotos,
              trustScore: tData.trustScore ?? 0,
              stats: {
                ...prev.stats,
                ...(tData.stats || {}),
              },
            };
          });
        }
      }

      // 2. Fetch leases from Supabase
      const leasesRes = await api.leases.getLeases();
      if (leasesRes?.leases && Array.isArray(leasesRes.leases)) {
        const formattedLeases: RentalLease[] = leasesRes.leases.map((l: any) => {
          const v = l.verification;
          const countryName = l.country || (l.address?.includes('(FR)') ? 'France' : l.address?.includes('(UK)') ? 'United Kingdom' : 'España');
          const isUK = countryName.toLowerCase().includes('united kingdom') || countryName.toLowerCase().includes('uk');
          const isFR = countryName.toLowerCase().includes('france');

          return {
            id: l.id,
            code: l.code,
            address: l.address || '',
            city: l.city || (l.address && l.address.includes(',') ? l.address.split(',')[1].trim() : ''),
            postalCode: l.postalCode || l.postal_code || '',
            country: countryName || '',
            countryCode: isFR ? 'FR' : isUK ? 'UK' : 'ES',
            flag: isFR ? '🇫🇷' : isUK ? '🇬🇧' : '🇪🇸',
            propertyType: l.propertyType || l.property_type || 'Apartment',
            isFurnished: true,
            monthlyRent: Number(l.rent) || 0,
            deposit: Number(l.deposit) || 0,
            currency: l.currency || (isUK ? '£' : '€'),
            startDate: l.startDate || l.start_date || '',
            endDate: l.endDate || l.end_date || '',
            isCurrent: (l.endDate || l.end_date) === 'Actual' || (l.endDate || l.end_date) === 'En cours',
            monthsCount: 12,
            status: l.status,
            verificationToken: l.code,
            landlordName: l.ownerNameGuess || l.owner_name_guess || '',
            landlordEmail: l.ownerContact || l.owner_contact || '',
            certificateHash: v?.cryptoHash || (l.status === 'verified' ? `0x${l.id.substring(0, 8).toUpperCase()}` : undefined),
            landlordRating: v ? {
              onTimePayment: v.rentPaidOk === 'yes',
              paymentScore: v.rentPaidOk === 'yes' ? 100 : v.rentPaidOk === 'sometimes' ? 80 : 50,
              propertyCareScore: v.propertyMaintained === 'yes' ? 5 : 3,
              neighbourhoodRelationsScore: 5,
              depositReturnedFull: v.propertyMaintained === 'yes',
              wouldRentAgain: v.wouldRecommend === 'yes',
              comment: v.comment || '',
              verifiedAt: v.confirmedAt ? new Date(v.confirmedAt).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US') : '',
              landlordName: l.ownerNameGuess || l.owner_name_guess || '',
              landlordType: 'particulier',
              verificationMethod: 'digital_signature',
            } : undefined,
          };
        });
        setLeases(formattedLeases);
      }
    } catch (err) {
      console.warn('Backend sync error:', err);
    }
  }, [language]);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Supabase Auth state listener & URL hash / confirmation token handler
  useEffect(() => {
    // 1. Check URL hash or query params immediately on mount (Supabase redirects here after email confirmation)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;

      // Handle Supabase error in hash or query (e.g. link expired, token invalid)
      if (hash.includes('error=') || search.includes('error=')) {
        const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
        const errorDesc = params.get('error_description') || params.get('error');
        if (errorDesc) {
          const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
          showToast(`Authentification : ${decoded}`);
        }
      }

      // Handle direct access_token in hash (type=signup, type=magiclink, type=recovery, etc.)
      if (hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
        const token = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (token) {
          setAuthToken(token);
          supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken || token,
          }).then(() => {
            refreshBackendData();
            showToast(
              type === 'signup'
                ? (language === 'es' ? '¡Email confirmado con éxito! Bienvenido a Rentia.' : language === 'en' ? 'Email successfully confirmed! Welcome to Rentia.' : 'Email confirmé avec succès ! Bienvenue sur Rentia.')
                : (language === 'es' ? 'Sesión iniciada con éxito.' : language === 'en' ? 'Logged in successfully.' : 'Connexion réussie.')
            );
            // Clean up the URL hash so the user doesn't see raw tokens in the address bar
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }).catch((err) => {
            console.error('Failed to set Supabase session from hash:', err);
          });
        }
      }
    }

    // 2. Subscribe to Supabase auth state changes (catches session detected in URL by supabase-js)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        setAuthToken(session.access_token);
        await refreshBackendData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshBackendData, language]);

  const pendingLeases = leases.filter(l => l.status === 'pending');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTenantPhotosUpdated = (newPhotos: string[]) => {
    localStorage.setItem('rentia_tenant_photos', JSON.stringify(newPhotos));
    setTenant(prev => ({
      ...prev,
      photos: newPhotos,
      avatarUrl: newPhotos[0] || prev.avatarUrl,
    }));
    showToast(
      language === 'es'
        ? '¡3 fotos verificadas añadidas! Propiedades desbloqueadas con éxito.'
        : language === 'en'
        ? '3 verified photos added! Properties unlocked successfully.'
        : '3 photos vérifiées ajoutées ! Propriétés débloquées avec succès.'
    );
  };

  const handleAuthSuccess = (userData: any, token?: string) => {
    if (userData) {
      if (token) {
        setAuthToken(token);
      } else if (userData.token) {
        setAuthToken(userData.token);
      }
      const userRole: UserRole = userData.role === 'admin' ? 'admin' : (userData.role === 'landlord' ? 'landlord' : (userData.role === 'agency' ? 'agency' : 'tenant'));
      setCurrentUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userRole,
      });

      if (userRole === 'admin') {
        setCurrentView('admin_panel');
      } else if (userRole === 'landlord' || userRole === 'agency') {
        setCurrentView('landlord_swipe');
      } else {
        setCurrentView('matching_discovery');
        const isQuizDone = localStorage.getItem('rentia_tenant_quiz_completed_current') === 'true' || 
                           localStorage.getItem(`rentia_tenant_quiz_completed_${userData.id}`) === 'true';
        if (!isQuizDone) {
          setIsTenantQuizOpen(true);
        }
      }

      setTenant(prev => ({
        ...prev,
        id: userData.id,
        role: userRole,
        fullName: userData.name || prev.fullName,
      }));
    }
    showToast(`${t.login}: ${userData?.name || userData?.email || ''}`);
    refreshBackendData();
  };

  const handleLogout = async () => {
    const currentSessionId = localStorage.getItem('rentia_session_id');
    try {
      await api.auth.logout(currentSessionId || undefined);
    } catch {}
    localStorage.removeItem('rentia_session_id');
    localStorage.removeItem('rentia_admin_mode');
    setAuthToken(null);
    await supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    setHasDeepLink(false);
    setCurrentView('tenant_passport');
    showToast(t.logout);
  };

  const handleAddLease = (newLease: RentalLease) => {
    setLeases(prev => [newLease, ...prev]);
    showToast(t.leaseAddedToast.replace('{code}', newLease.code || 'VAL784'));
    refreshBackendData();
  };

  const handleDeleteLease = async (leaseId: string) => {
    try {
      await api.leases.deleteLease(leaseId);
      setLeases(prev => prev.filter(l => l.id !== leaseId));
      showToast(t.leaseDeletedToast);
    } catch (err: any) {
      showToast(err.message || 'Error');
    }
  };

  const handleVerifyLease = (leaseId: string, ratingData: any) => {
    setLeases(prev => prev.map(l => {
      if (l.id === leaseId || l.code === leaseId) {
        return {
          ...l,
          status: 'verified',
          certificateHash: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
          landlordRating: ratingData,
        };
      }
      return l;
    }));

    showToast(t.certifiedSuccess);
    refreshBackendData();
  };

  const handleEnterAdminDirectly = async () => {
    try {
      const res = await api.auth.adminDirectAccess('soullis10@gmail.com', 'Administrador Principal Rentia');
      if (res?.token) {
        setAuthToken(res.token);
      }
      localStorage.setItem('rentia_admin_mode', 'true');
      const adminUser = res?.user || {
        id: 'super-admin-direct',
        name: 'Administrador Principal Rentia',
        email: 'soullis10@gmail.com',
        role: 'admin' as UserRole,
      };
      setCurrentUser(adminUser);
      setCurrentView('admin_panel');
      showToast(language === 'es' ? 'Acceso de Administrador autorizado' : 'Administrator access authorized');
    } catch (err) {
      console.warn('Fallback admin direct access:', err);
      localStorage.setItem('rentia_admin_mode', 'true');
      const adminUser = {
        id: 'super-admin-direct',
        name: 'Administrador Principal Rentia',
        email: 'soullis10@gmail.com',
        role: 'admin' as UserRole,
      };
      setCurrentUser(adminUser);
      setCurrentView('admin_panel');
      showToast(language === 'es' ? 'Acceso de Administrador autorizado' : 'Administrator access authorized');
    }
  };

  // 1. If not logged in and no deep link:
  if (!currentUser && !hasDeepLink) {
    if (currentView === 'admin_panel') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
          <Header
            language={language}
            onLanguageChange={setLanguage}
            onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
            currentUser={null}
            onOpenLogin={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenAuthModal={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenRegister={() => setIsRoleModalOpen(true)}
            onLogout={handleLogout}
            currentView={currentView}
            onViewChange={(v) => setCurrentView(v)}
            onNavigate={(v) => setCurrentView(v)}
            onEnterAdmin={handleEnterAdminDirectly}
          />

          <AdminAccessGate
            language={language}
            currentUser={null}
            onOpenLogin={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onBackToApp={() => setCurrentView('tenant_passport')}
            onSwitchAccount={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onAdminAuthSuccess={(adminUser, token) => {
              handleAuthSuccess(adminUser, token);
              setCurrentView('admin_panel');
              showToast(language === 'es' ? '¡Bienvenido al Panel de Administración!' : 'Welcome to the Admin Panel!');
            }}
          />

          <RoleSelectionModal
            isOpen={isRoleModalOpen}
            onClose={() => setIsRoleModalOpen(false)}
            onSelectRole={(chosenRole) => {
              setAuthSelectedRole(chosenRole);
              setIsRoleModalOpen(false);
              setAuthInitialMode('register');
              setIsAuthModalOpen(true);
            }}
            language={language}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authInitialMode}
            selectedRole="admin"
            onAuthSuccess={handleAuthSuccess}
            language={language}
          />
        </div>
      );
    }

    return (
      <>
        <WelcomeLanding
          onGetStarted={() => setIsRoleModalOpen(true)}
          onOpenRegisterRole={(role) => {
            setAuthSelectedRole(role);
            setAuthInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthSelectedRole('tenant');
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenLoginRole={(role) => {
            setAuthSelectedRole(role);
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onVerifyLeaseDirect={() => {
            setHasDeepLink(true);
            setCurrentView('landlord_verify_flow');
          }}
          language={language}
          onLanguageChange={setLanguage}
        />

        {/* Step 2: Mandatory & Exclusive Role Choice */}
        <RoleSelectionModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSelectRole={(chosenRole) => {
            setAuthSelectedRole(chosenRole);
            setIsRoleModalOpen(false);
            setAuthInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          language={language}
        />

        {/* Auth Modal (Register with role & phone, or Login) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          currentTenant={null}
          onLogout={handleLogout}
          onOpenPrivacyPolicy={() => {
            setIsAuthModalOpen(false);
            setIsPrivacyModalOpen(true);
          }}
          language={language}
          initialMode={authInitialMode}
          selectedRole={authSelectedRole}
        />

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          language={language}
          currentTenant={tenant}
        />
      </>
    );
  }

  // 2. Authenticated App Flow or Direct Deep Link
  const isLandlord = currentUser?.role === 'landlord' || currentUser?.role === 'agency';

  return (
    <div className={`min-h-screen bg-[#F7FBFA] text-[#1C3B3A] flex flex-col font-sans selection:bg-[#0FA3A3] selection:text-white ${t.isRtl ? 'font-arabic' : ''}`}>
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C3B3A] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#2EC4A6] flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#2EC4A6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Role-Aware Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        pendingCount={pendingLeases.length}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenScanContract={() => setIsAddModalOpen(true)}
        onOpenAuthModal={() => {
          setAuthInitialMode('login');
          setIsAuthModalOpen(true);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDeleteAccountModal={() => setIsDeleteAccountModalOpen(true)}
        tenantName={tenant.fullName}
        language={language}
        onLanguageChange={setLanguage}
        onEnterAdmin={handleEnterAdminDirectly}
      />

      {/* Main Content Area */}
      <main className={currentView === 'idealista_map_search' ? "flex-1 w-full p-0 flex flex-col" : "flex-1 max-w-xl sm:max-w-3xl w-full mx-auto px-4 py-5 space-y-4"}>
        
        {/* ================================================================ */}
        {/* SHARED MAP VIEW (Accessible to Landlords, Agencies & Tenants) */}
        {/* ================================================================ */}
        {currentView === 'idealista_map_search' && (
          <ErrorBoundary fallbackTitle="Mapa de búsqueda de viviendas en España">
            <IdealistaMapSearch
              language={language}
              isLandlord={isLandlord}
              currentUser={currentUser}
              tenant={tenant}
              onPhotosUpdated={handleTenantPhotosUpdated}
              onOpenQuiz={() => setIsTenantQuizOpen(true)}
              onLikeListing={async (listingId) => {
                if (isLandlord) {
                  showToast(language === 'es' ? 'Los propietarios pueden gestionar el estado de los inmuebles' : 'Landlords can manage listing statuses');
                  return;
                }
                try {
                  await api.matching.swipe({
                    actorId: tenant.id || currentUser?.id || 'demo_tenant',
                    actorRole: 'tenant',
                    listingId,
                    targetUserId: 'landlord_demo',
                    action: 'like',
                  });
                  showToast(language === 'es' ? '¡Vivienda guardada en tus favoritos!' : 'Saved to favorites!');
                } catch (err) {
                  console.error('Error swiping like from map:', err);
                }
              }}
            />
          </ErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* LANDLORD DEDICATED VIEWS (Strictly for landlords) */}
        {/* ================================================================ */}
        {isLandlord && (
          <>
            {/* VIEW L1: Landlord Dashboard & Published Listings (Apartado de Anuncios) */}
            {currentView === 'landlord_dashboard' && (
              <LandlordDashboard
                currentUser={{ id: currentUser.id, email: currentUser.email, name: currentUser.name }}
                onNavigateToChat={() => setCurrentView('matches_chat')}
                onNavigateToSwipe={() => setCurrentView('landlord_swipe')}
                onNavigateToPublish={() => setCurrentView('landlord_publish')}
                language={language}
              />
            )}

            {/* VIEW L1.5: Landlord Publish Listing (Apartado exclusivo Publicar Anuncio al lado de Anuncios) */}
            {currentView === 'landlord_publish' && (
              <PublishListingView
                currentUserId={currentUser.id}
                currentUserEmail={currentUser.email}
                language={language}
                onListingCreated={() => {
                  setCurrentView('landlord_dashboard');
                  refreshBackendData();
                }}
                onBackToDashboard={() => setCurrentView('landlord_dashboard')}
              />
            )}

            {/* VIEW L2: Landlord Swipe (Candidatos Inquilinos) */}
            {currentView === 'landlord_swipe' && (
              <LandlordSwipeDiscovery
                currentUser={currentUser}
                language={language}
                onNavigateToChat={() => setCurrentView('matches_chat')}
                onNavigateToLikes={() => setCurrentView('landlord_likes')}
              />
            )}

            {/* VIEW L3: Landlord Liked Candidates (Perfiles con Like) */}
            {currentView === 'landlord_likes' && (
              <LandlordLikesView
                currentUser={currentUser}
                language={language}
                onBack={() => setCurrentView('landlord_swipe')}
                onOpenDiscovery={() => setCurrentView('landlord_swipe')}
                onOpenChat={() => setCurrentView('matches_chat')}
              />
            )}

            {/* VIEW L4: Landlord Chat */}
            {currentView === 'matches_chat' && (
              <MatchesListView
                currentUserId={currentUser.id}
                isLandlord={true}
                language={language}
                onExploreClick={() => setCurrentView('landlord_dashboard')}
              />
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* TENANT DEDICATED VIEWS (Strictly for tenants) */}
        {/* ================================================================ */}
        {!isLandlord && (
          <>
            {/* VIEW T1: TENANT PASSPORT & CERTIFICADO UNIFICADO */}
            {(currentView === 'tenant_passport' || currentView === 'certificate_export') && (
              <UnifiedPassportAndCertificate
                tenant={tenant}
                leases={leases}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onOpenScanContract={() => setIsAddModalOpen(true)}
                onDeleteLease={handleDeleteLease}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                language={language}
              />
            )}

            {/* VIEW T3: MATCHING & SWIPE DISCOVERY */}
            {currentView === 'matching_discovery' && (
              <ErrorBoundary fallbackTitle="Explorador de viviendas y mapa interactivo">
                <SwipeDiscovery
                  tenant={tenant}
                  language={language}
                  onOpenPassportTab={() => setCurrentView('tenant_passport')}
                  onNavigateToChat={() => setCurrentView('matches_chat')}
                  onOpenQuiz={() => setIsTenantQuizOpen(true)}
                  onPhotosUpdated={handleTenantPhotosUpdated}
                  currentUserEmail={currentUser?.email || ''}
                />
              </ErrorBoundary>
            )}

            {/* VIEW T4: TENANT POST-MATCH MESSAGING */}
            {currentView === 'matches_chat' && (
              <MatchesListView
                currentUserId={tenant.id || currentUser?.id || ''}
                isLandlord={false}
                tenantProfile={tenant}
                language={language}
                onExploreClick={() => setCurrentView('matching_discovery')}
              />
            )}

            {/* VIEW T5: MIS LIKES (Prioridad P2) */}
            {currentView === 'tenant_likes' && (
              <MyLikesView
                language={language}
                onBack={() => setCurrentView('matching_discovery')}
                onOpenDiscovery={() => setCurrentView('matching_discovery')}
                onOpenChat={() => setCurrentView('matches_chat')}
              />
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* ADMIN MODERATION PANEL (Prioridad P1.5, P1.6) */}
        {/* ================================================================ */}
        {currentView === 'admin_panel' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              language={language}
              onBackToApp={() => {
                localStorage.removeItem('rentia_admin_mode');
                setCurrentView(isLandlord ? 'landlord_dashboard' : 'tenant_passport');
              }}
              onNavigateToView={(view: ViewMode) => {
                setCurrentView(view);
                showToast(`Cambiando a: ${view.replace('_', ' ')}`);
              }}
              currentUser={currentUser}
              onUserChange={setCurrentUser}
            />
          ) : (
            <AdminAccessGate
              language={language}
              currentUser={currentUser}
              onOpenLogin={() => {
                setAuthInitialMode('login');
                setIsAuthModalOpen(true);
              }}
              onBackToApp={() => {
                localStorage.removeItem('rentia_admin_mode');
                setCurrentView(isLandlord ? 'landlord_dashboard' : 'tenant_passport');
              }}
              onSwitchAccount={() => {
                handleLogout();
                setAuthInitialMode('login');
                setIsAuthModalOpen(true);
              }}
              onAdminAuthSuccess={(adminUser, token) => {
                localStorage.setItem('rentia_admin_mode', 'true');
                handleAuthSuccess(adminUser, token);
                setCurrentView('admin_panel');
                showToast('¡Sesión de Administrador iniciada correctamente!');
              }}
            />
          )
        )}

        {/* ================================================================ */}
        {/* PUBLIC INSPECTION VIEW (Deep Link) */}
        {/* ================================================================ */}
        {currentView === 'landlord_public_view' && (
          <PublicLandlordInspection
            tenant={tenant}
            leases={leases}
            onBackToPassport={() => setCurrentView(isLandlord ? 'landlord_dashboard' : 'tenant_passport')}
            onOpenCertificate={() => setCurrentView('certificate_export')}
            language={language}
          />
        )}

        {/* FAST VERIFICATION FOR UNLOGGED DEEP LINK */}
        {!currentUser && currentView === 'landlord_verify_flow' && (
          <LandlordFastVerification
            lease={null}
            currentUser={null}
            onVerifyComplete={handleVerifyLease}
            onBackToPassport={() => setHasDeepLink(false)}
            onLogout={handleLogout}
            language={language}
          />
        )}

      </main>

      {/* Minimal Footer with GDPR & Privacy Center access */}
      <footer className="no-print border-t border-gray-100 text-center py-4 px-4 text-xs text-[#5C7B79]">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-1">
          <span className="font-semibold text-[#1C3B3A]">Rentia</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="text-[#0FA3A3] font-bold hover:underline inline-flex items-center gap-1"
            id="footer-privacy-link"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{t.privacyCenterBtn}</span>
          </button>
          {currentUser?.role === 'admin' && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={() => setCurrentView('admin_panel')}
                className="text-amber-700/90 hover:text-amber-900 font-semibold hover:underline inline-flex items-center gap-1"
                id="footer-admin-link"
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Panel de administración</span>
              </button>
            </>
          )}
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setAuthSelectedRole('landlord');
              setAuthInitialMode('register');
              setIsAuthModalOpen(true);
            }}
            className="text-stone-600 hover:text-[#0FA3A3] font-semibold hover:underline inline-flex items-center gap-1"
            id="footer-register-landlord"
          >
            <span>Inscripción Propietario</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setAuthSelectedRole('agency');
              setAuthInitialMode('register');
              setIsAuthModalOpen(true);
            }}
            className="text-stone-600 hover:text-indigo-700 font-semibold hover:underline inline-flex items-center gap-1"
            id="footer-register-agency"
          >
            <span>Inscripción Agencia</span>
          </button>
          {!currentUser && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setHasDeepLink(true);
                  setCurrentView('landlord_verify_flow');
                }}
                className="text-stone-600 hover:text-[#1C3B3A] font-semibold hover:underline inline-flex items-center gap-1"
                id="footer-landlord-verify-link"
              >
                <span>{t.verifyLandlordBtn}</span>
              </button>
            </>
          )}
        </div>
        <p className="text-[11px] text-gray-400">{t.tagline} • 100% {t.verifiedBadge} • RGPD Compliant (UE 2016/679)</p>
      </footer>

      {/* Floating Admin Dashboards Shortcut (Solo visible para Administrador) */}
      {currentUser?.role === 'admin' && currentView !== 'admin_panel' && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setCurrentView('admin_panel')}
            className="px-3.5 py-2 rounded-2xl bg-[#1E1B4B] hover:bg-[#28235C] text-amber-300 hover:text-amber-200 border border-amber-400/40 text-xs font-bold transition-all shadow-xl flex items-center gap-2"
            id="floating-btn-admin-dashboards"
            title="Abrir Centro de Control y Todos los Dashboards de la App"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Suite Dashboards Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSelectRole={(chosenRole) => {
          setAuthSelectedRole(chosenRole);
          setIsRoleModalOpen(false);
          setAuthInitialMode('register');
          setIsAuthModalOpen(true);
        }}
        language={language}
      />

      <AddLeaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLease={handleAddLease}
        language={language}
      />

      <SharePassportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tenant={tenant}
        onOpenCertificate={() => {
          setIsShareModalOpen(false);
          setCurrentView('certificate_export');
        }}
        onOpenLandlordView={() => {
          setIsShareModalOpen(false);
          setCurrentView('landlord_public_view');
        }}
        language={language}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentTenant={currentUser ? { name: currentUser.name || tenant.fullName, email: currentUser.email, role: currentUser.role } : null}
        onLogout={handleLogout}
        onOpenPrivacyPolicy={() => {
          setIsAuthModalOpen(false);
          setIsPrivacyModalOpen(true);
        }}
        language={language}
        initialMode={authInitialMode}
        selectedRole={authSelectedRole}
      />

      <PaymentHistoryModal
        isOpen={isPaymentsModalOpen}
        onClose={() => setIsPaymentsModalOpen(false)}
        leases={leases}
        language={language}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        language={language}
        currentTenant={tenant}
        onAccountDeleted={() => {
          handleLogout();
          setToastMessage(t.accountDeletedToast);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        isLandlord={isLandlord}
        language={language}
        onDeactivated={() => {
          setIsDeleteAccountModalOpen(false);
          handleLogout();
          showToast(
            language === 'es'
              ? 'Cuenta desactivada temporalmente. Vuelve a iniciar sesión para reactivarla.'
              : language === 'en'
              ? 'Account temporarily deactivated. Log back in anytime to reactivate it.'
              : 'Compte désactivé temporairement. Vous pourrez le réactiver en vous reconnectant.'
          );
        }}
        onDeleted={() => {
          setIsDeleteAccountModalOpen(false);
          handleLogout();
          showToast(
            language === 'es'
              ? 'Tu cuenta y datos han sido definitivamente eliminados y anonimizados (RGPD).'
              : language === 'en'
              ? 'Your account and data have been permanently deleted and anonymized (GDPR).'
              : 'Votre compte et vos données ont été définitivement supprimés et anonymisés (RGPD).'
          );
        }}
      />

      {/* Onboarding de Notificaciones (Web y Móvil) */}
      <NotificationPermissionModal language={language} />

      {/* Cuestionario de Matching y Onboarding Inteligente Gamificado del Inquilino */}
      <TenantGamifiedOnboardingModal
        isOpen={isTenantQuizOpen}
        onClose={() => setIsTenantQuizOpen(false)}
        currentUser={{
          id: tenant.id || currentUser?.id || 'demo_tenant',
          email: currentUser?.email || tenant.email,
          name: currentUser?.name || tenant.fullName,
        }}
        currentTenant={tenant}
        onSaved={(updatedProfile) => {
          setTenant(prev => ({
            ...prev,
            ...updatedProfile,
            fullName: updatedProfile.fullName || updatedProfile.name || prev.fullName,
            avatarUrl: updatedProfile.avatarUrl || updatedProfile.photos?.[0] || prev.avatarUrl,
            photos: updatedProfile.photos || prev.photos,
          }));
          showToast(
            language === 'es'
              ? '¡Perfil de matching completado con éxito! Algoritmo calibrado.'
              : language === 'en'
              ? 'Matching profile completed! Algorithm calibrated.'
              : 'Profil de matching complété avec succès ! Algorithme calibré.'
          );
          refreshBackendData();
        }}
      />

    </div>
  );
}

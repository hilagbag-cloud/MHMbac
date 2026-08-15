/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Application Principale & Routage
 * Créateur : Hilarus GBAGOULE
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { VerificationModal } from './components/VerificationModal';
import { HomePage } from './pages/HomePage';
import { Seo } from './components/Seo';
import { recordBetaEvent } from './lib/beta';

const OrientationGuidePage = lazy(() => import('./pages/OrientationGuidePage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const BetaPage = lazy(() => import('./pages/BetaPage').then((module) => ({ default: module.BetaPage })));

function AppContent() {
  const { user, isBetaTester, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const isPartnerPortal = typeof window !== 'undefined' && window.location.hostname === 'partenaires.bacpilot.site';

  // Synchronisation avec l'historique du navigateur
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
    };

    const initialPath = window.location.pathname || '/';
    setCurrentRoute(initialPath);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (user && isBetaTester && currentRoute !== '/beta') {
      void recordBetaEvent('route_view', currentRoute === '/' ? 'accueil' : currentRoute.replace('/', '') as any, currentRoute);
    }
  }, [currentRoute, isBetaTester, user]);

  const navigate = (route: string) => {
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    try {
      window.history.pushState({}, '', normalizedRoute);
    } catch {
      // Ignorer dans certains environnements restreints
    }
    setCurrentRoute(normalizedRoute);
  };

  // Redirection protégée pour les routes privées
  const renderCurrentView = () => {
    if (isLoading) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-rose-500 animate-spin" />
          <div className="text-sm font-semibold text-slate-400">
            Chargement de MHM SOLUTIONS...
          </div>
        </div>
      );
    }

    switch (currentRoute) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/login':
        return <LoginPage navigate={navigate} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
      case '/onboarding':
        return <OnboardingPage navigate={navigate} />;
      case '/dashboard':
        return user ? <DashboardPage navigate={navigate} /> : <LoginPage navigate={navigate} />;
      case '/profile':
        return user ? <ProfilePage navigate={navigate} /> : <LoginPage navigate={navigate} />;
      case '/beta':
        return <BetaPage navigate={navigate} />;
      case '/orientation-bac-benin':
        return <OrientationGuidePage />;
      case '/methodologie':
        return <MethodologyPage navigate={navigate} />;
      case '/contact':
        return <ContactPage />;
      case '/partenaires':
        return <PartnerPage />;
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/privacy':
        return <PrivacyPage navigate={navigate} />;
      case '/terms':
        return <TermsPage navigate={navigate} />;
      default:
        return <NotFoundPage navigate={navigate} />;
    }
  };

  if (isPartnerPortal) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-semibold text-slate-300">Chargement de l’espace partenaire…</div>}>
        <Seo route="/" partnerPortal />
        <PartnerPage partnerPortal />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-rose-500 selection:text-white">
      
      <Seo route={currentRoute} />

      {/* Barre de navigation globale */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        openTestsModal={() => setIsTestsModalOpen(true)}
      />

      {/* Vue active */}
      <main className="flex-grow">
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">Chargement de la page…</div>}>
          {renderCurrentView()}
        </Suspense>
      </main>

      {/* Pied de page global */}
      <Footer navigate={navigate} />

      {/* Modal des Tests Automatisés & Vérifications MVP1 */}
      <VerificationModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

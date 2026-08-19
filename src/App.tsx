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
import { getArticleBySlug } from './lib/articles';

const OrientationGuidePage = lazy(() => import('./pages/OrientationGuidePage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FounderPage = lazy(() => import('./pages/FounderPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const BetaPage = lazy(() => import('./pages/BetaPage').then((module) => ({ default: module.BetaPage })));
const BetaAccessPage = lazy(() => import('./pages/BetaAccessPage'));
const BetaPortalPage = lazy(() => import('./pages/BetaPortalPage'));
const BetaContributorsPage = lazy(() => import('./pages/BetaContributorsPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const ReferralLandingPage = lazy(() => import('./pages/ReferralLandingPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));

function AppContent() {
  const { user, isBetaTester, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const isPartnerPortal = typeof window !== 'undefined' && window.location.hostname === 'partenaires.bacpilot.site';
  const isBetaPortal = typeof window !== 'undefined' && window.location.hostname === 'beta.bacpilot.site';
  const routePath = currentRoute.split('?')[0] || '/';

  // Synchronisation avec l'historique du navigateur
  useEffect(() => {
    const handlePopState = () => {
        const path = `${window.location.pathname || '/'}${window.location.search || ''}`;
        setCurrentRoute(path);
    };

    const initialPath = `${window.location.pathname || '/'}${window.location.search || ''}`;
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

    if (routePath.startsWith('/r/')) {
      return <ReferralLandingPage code={routePath.slice(3)} navigate={navigate} />;
    }

    switch (routePath) {
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
      case '/parrainage':
        return <ReferralPage navigate={navigate} />;
      case '/avis':
        return <ReviewsPage navigate={navigate} />;
      case '/articles':
        return <ArticlesPage navigate={navigate} />;
      case '/soutenir':
        return <SupportPage navigate={navigate} />;
      case '/beta':
        return <BetaPage navigate={navigate} />;
      case '/beta-access':
        return <BetaAccessPage navigate={navigate} />;
      case '/contributeurs-beta':
        return <BetaContributorsPage navigate={navigate} />;
      case '/orientation-bac-benin':
        return <OrientationGuidePage />;
      case '/methodologie':
        return <MethodologyPage navigate={navigate} />;
      case '/contact':
        return <ContactPage />;
      case '/partenaires':
        return <PartnerPage />;
      case '/about':
      case '/a-propos':
        return <AboutPage navigate={navigate} />;
      case '/fondateur-hilarus-gbagoule':
        return <FounderPage navigate={navigate} />;
      case '/privacy':
        return <PrivacyPage navigate={navigate} />;
      case '/terms':
        return <TermsPage navigate={navigate} />;
      default:
        if (routePath.startsWith('/articles/')) {
          const article = getArticleBySlug(routePath.slice('/articles/'.length));
          return article ? <ArticlePage article={article} navigate={navigate} /> : <NotFoundPage navigate={navigate} />;
        }
        return <NotFoundPage navigate={navigate} />;
    }
  };

  if (isBetaPortal) {
    return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-semibold text-slate-300">Chargement du portail bêta…</div>}><Seo route="/" betaPortal /><BetaPortalPage accessUrl="https://bacpilot.site/beta-access" signUpUrl="https://bacpilot.site/register?returnTo=beta" /></Suspense>;
  }

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
      
      <Seo route={routePath.startsWith('/r/') ? '/invitation' : routePath} />

      {/* Barre de navigation globale */}
      <Navbar
        currentRoute={routePath}
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

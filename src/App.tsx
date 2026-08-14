/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Application Principale & Routage
 * Créateur : Hilarus GBAGOULE
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { VerificationModal } from './components/VerificationModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-rose-500 selection:text-white">
      
      {/* Barre de navigation globale */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        openTestsModal={() => setIsTestsModalOpen(true)}
      />

      {/* Vue active */}
      <main className="flex-grow">
        {renderCurrentView()}
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

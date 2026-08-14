/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Barre de navigation principale avec identité de marque et sélecteur de mode
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Compass,
  GraduationCap,
  LayoutDashboard,
  User,
  Info,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  openTestsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, openTestsModal }) => {
  const { user, profile, signOut, isSupabaseLive, switchDemoPersona } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Identité */}
          <div 
            id="brand-logo-container"
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform border border-rose-400/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-white">
                  MHM <span className="text-rose-400 font-sans font-semibold">SOLUTIONS</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  MVP1
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium tracking-wide">
                Créateur : <strong className="text-slate-100 font-semibold">Hilarus GBAGOULE</strong>
              </span>
            </div>
          </div>

          {/* Navigation Liens Desktop */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-link-home"
              onClick={() => handleNav('/')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === '/'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Accueil
            </button>

            <button
              id="nav-link-about"
              onClick={() => handleNav('/about')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentRoute === '/about'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Info className="w-4 h-4 text-indigo-400" />
              À propos
            </button>

            {user ? (
              <>
                <button
                  id="nav-link-dashboard"
                  onClick={() => handleNav('/dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentRoute === '/dashboard'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-400" />
                  Tableau de bord
                </button>

                <button
                  id="nav-link-profile"
                  onClick={() => handleNav('/profile')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentRoute === '/profile'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  Mon profil
                </button>
              </>
            ) : null}
          </nav>

          {/* Actions & Profil à droite */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Bouton de bascule Persona de Démo rapide */}
            <div className="relative">
              <button
                id="persona-switch-btn"
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Tester différents profils bacheliers (Série D, C, A)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[120px] truncate">
                  {profile?.display_name || 'Profil Démo'}
                </span>
              </button>

              {personaMenuOpen && (
                <div 
                  id="persona-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 text-xs z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-2 py-1.5 font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Changer de profil d’essai
                  </div>
                  <button
                    onClick={() => {
                      switchDemoPersona('dossou_d');
                      setPersonaMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-white">Stéphane (Série D - Bien)</div>
                      <div className="text-[11px] text-slate-400">Objectif Carrière Informatique</div>
                    </div>
                    {profile?.series === 'D' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoPersona('amina_c');
                      setPersonaMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-white">Amina (Série C - Très bien)</div>
                      <div className="text-[11px] text-slate-400">Objectif Bourse & Santé</div>
                    </div>
                    {profile?.series === 'C' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoPersona('junior_a');
                      setPersonaMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-white">Junior (Série A - Assez bien)</div>
                      <div className="text-[11px] text-slate-400">Objectif Carrière Droit</div>
                    </div>
                    {profile?.series === 'A' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoPersona('new_empty');
                      setPersonaMenuOpen(false);
                      handleNav('/onboarding');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-rose-300 border-t border-slate-800 mt-1 transition-colors"
                  >
                    <div className="font-medium">+ Nouveau profil à personnaliser</div>
                  </button>
                </div>
              )}
            </div>

            {/* Statut Supabase / Live Indicator */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700 text-slate-300"
              title={isSupabaseLive ? "Connecté à Supabase Cloud" : "Mode Démonstration Actif (Simulé en local)"}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isSupabaseLive ? 'Supabase En Ligne' : 'Mode Démo MVP1'}</span>
            </div>

            {/* Bouton Vérifications & Tests Automatisés */}
            {openTestsModal && (
              <button
                id="btn-open-tests"
                onClick={openTestsModal}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 flex items-center gap-1 transition-colors"
                title="Consulter le banc de vérification des tests unitaires (Auth, Profil, Algorithme)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tests MVP1</span>
              </button>
            )}

            {user ? (
              <button
                id="btn-nav-logout"
                onClick={async () => {
                  await signOut();
                  handleNav('/');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Connexion
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => handleNav('/register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-900/30 transition-all hover:scale-105"
                >
                  S'inscrire
                </button>
              </div>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div id="mobile-menu-panel" className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Profil actif : <strong className="text-white">{profile?.display_name || 'Bachelier Démo'}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isSupabaseLive ? 'Supabase Live' : 'Mode Démo'}</span>
            </div>
          </div>

          <button
            onClick={() => handleNav('/')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentRoute === '/' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            Accueil
          </button>
          <button
            onClick={() => handleNav('/about')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentRoute === '/about' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <Info className="w-4 h-4 text-indigo-400" />
            À propos de MHM SOLUTIONS
          </button>

          {user ? (
            <>
              <button
                onClick={() => handleNav('/dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentRoute === '/dashboard' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-rose-400" />
                Tableau de bord
              </button>
              <button
                onClick={() => handleNav('/profile')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentRoute === '/profile' ? 'bg-slate-800 text-white' : 'text-slate-300'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                Mon profil & Préférences
              </button>
              <button
                onClick={() => handleNav('/onboarding')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-amber-300 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Repasser la personnalisation
              </button>

              <button
                onClick={async () => {
                  await signOut();
                  handleNav('/');
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-slate-800 text-white"
              >
                Connexion
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-rose-500 text-white shadow-md"
              >
                S'inscrire
              </button>
            </div>
          )}

          {openTestsModal && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openTestsModal();
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Lancer les tests MVP1 (Auth, RLS, Ranking)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

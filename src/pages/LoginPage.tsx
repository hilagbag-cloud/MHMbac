/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page de connexion avec gestion d'erreurs et raccourcis démo
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Compass,
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  navigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { signIn, isSupabaseLive, switchDemoPersona, errorMessage, clearError } = useAuth();
  
  const [email, setEmail] = useState('bachelier.demo@mhmsolutions.bj');
  const [password, setPassword] = useState('SecurPass2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setLocalError(res.error || 'Identifiants invalides.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (persona: 'dossou_d' | 'amina_c' | 'junior_a') => {
    switchDemoPersona(persona);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Titre */}
        <div className="text-center space-y-2">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-700 text-white shadow-xl shadow-rose-950/30 cursor-pointer hover:scale-105 transition-transform"
          >
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            Connexion à ton espace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Accède à ton tableau de bord et à tes recommandations MHM SOLUTIONS.
          </p>
        </div>

        {/* Formulaire de Connexion */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          
          {(localError || errorMessage) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Mot de passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-xs uppercase font-semibold text-slate-400">
              Ou test rapide démo
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Raccourcis Profils Démo */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-500 text-center">
              Accédez instantanément avec un profil d’évaluation calibré :
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('dossou_d')}
                className="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-center transition-colors"
              >
                Série D
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('amina_c')}
                className="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-center transition-colors"
              >
                Série C
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('junior_a')}
                className="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-center transition-colors"
              >
                Série A
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-rose-500 hover:text-rose-600 font-bold underline"
            >
              Créer mon compte rapidement
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

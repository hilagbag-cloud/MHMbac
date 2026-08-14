/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Tableau de bord protégé avec recommandations, jauges et note de transparence
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Award,
  Target,
  Percent,
  Flame,
  Briefcase,
  Compass,
  ArrowRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROGRAMMES } from '../lib/demoData';
import { rankProgrammes } from '../lib/ranking';
import { ProgrammeCard } from '../components/ProgrammeCard';
import { TransparencyBadge } from '../components/TransparencyBadge';
import { ScoredProgramme } from '../types/orientation';

interface DashboardPageProps {
  navigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user, profile, preferences, updatePreferences, switchDemoPersona } = useAuth();
  
  // État local de la shortlist d'orientation
  const [shortlist, setShortlist] = useState<string[]>(['prog-01']);
  const [activeTab, setActiveTab] = useState<'recommandations' | 'shortlist' | 'indicateurs'>('recommandations');
  const [quickGoal, setQuickGoal] = useState<'bourse' | 'carriere'>(
    preferences?.primary_goal || 'carriere'
  );
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  // Calcul du classement personnalisé
  const rankedProgrammes = rankProgrammes(
    DEMO_PROGRAMMES,
    profile || { series: 'D', mention: 'Bien' },
    {
      ...preferences,
      primary_goal: quickGoal,
    }
  );

  const topThree = rankedProgrammes.slice(0, 3);
  const allRanked = rankedProgrammes;

  // Gestion de la shortlist
  const toggleShortlist = (item: ScoredProgramme) => {
    if (shortlist.includes(item.programme.id)) {
      setShortlist(shortlist.filter((id) => id !== item.programme.id));
    } else {
      setShortlist([...shortlist, item.programme.id]);
    }
  };

  // Modification rapide d'objectif depuis le dashboard
  const handleToggleGoal = async (newGoal: 'bourse' | 'carriere') => {
    setQuickGoal(newGoal);
    setIsUpdatingGoal(true);
    try {
      await updatePreferences({
        primary_goal: newGoal,
        scholarship_priority: newGoal === 'bourse' ? 85 : 50,
        career_priority: newGoal === 'carriere' ? 90 : 50,
      });
    } catch (err) {
      console.error('Erreur mise à jour objectif:', err);
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Conteneur Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. BIENVENUE & PROFIL STATS BAR                                           */}
        {/* ========================================================================= */}
        <div
          id="dashboard-welcome-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl"
        >
          {/* Lueur de fond */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Tableau de bord d’orientation</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight">
                Bienvenue,{' '}
                <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent italic">
                  {profile?.display_name || user?.user_metadata?.display_name || 'Bachelier'}
                </span>{' '}
                !
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm text-slate-300">
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-white">
                  Série {profile?.series || 'D'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-rose-400">
                  Mention {profile?.mention || 'Bien'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-emerald-400">
                  Objectif : {quickGoal === 'bourse' ? 'Bourses d’Études' : 'Parcours Carrière'}
                </span>
              </div>
            </div>

            {/* Boutons d'action rapide */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-edit-onboarding"
                onClick={() => navigate('/onboarding')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Reconfigurer le profil</span>
              </button>

              <button
                id="btn-view-profile"
                onClick={() => navigate('/profile')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Mon Espace Profil</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SÉLECTEUR RAPIDE D'OBJECTIF (BOURSE vs CARRIÈRE)                       */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <span>Ajuster mon objectif stratégique en temps réel :</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Basculez instantanément la pondération de l'algorithme selon vos priorités.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => handleToggleGoal('bourse')}
              disabled={isUpdatingGoal}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                quickGoal === 'bourse'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Priorité Bourse</span>
            </button>

            <button
              onClick={() => handleToggleGoal('carriere')}
              disabled={isUpdatingGoal}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                quickGoal === 'carriere'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Priorité Carrière</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RECOMMANDATIONS INITIALES (3 CARTES CLÉS)                               */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Analyse Algorithmique MVP1
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                Mes recommandations initiales (Top 3)
              </h2>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Calculé pour Série <strong>{profile?.series || 'D'}</strong> • Mention <strong>{profile?.mention || 'Bien'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topThree.map((p) => (
              <ProgrammeCard
                key={p.programme.id}
                item={p}
                isShortlisted={shortlist.includes(p.programme.id)}
                onToggleShortlist={toggleShortlist}
              />
            ))}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. INDICATEURS DE SUIVI SYNTHÉTIQUES                                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pression Concurrence
              </span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Modérée à Élevée
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selon le ratio de candidats observés par filière dans le jeu démo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Moyenne Bourses Top 3
              </span>
              <Percent className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(
                (topThree.reduce((acc, curr) => acc + curr.programme.demoStats.scholarshipRatio, 0) /
                  (topThree.length || 1)) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Moyenne estimée des admis recevant une bourse universitaire.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Adéquation Métiers
              </span>
              <Briefcase className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {preferences?.career_keywords?.length || 2} Domaines Ciblés
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {preferences?.career_keywords?.join(', ') || 'Informatique & Sciences'}
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 5. MA PROCHAINE ÉTAPE & SHORTLIST                                         */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Plan d'action
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold">
                Ma prochaine étape d’orientation
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Shortlist actuelle : <strong className="text-white">{shortlist.length} filière(s)</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-400 text-sm">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">1</span>
                <span>Explorer l'ensemble des filières</span>
              </div>
              <p className="text-xs text-slate-300">
                Consulte les {DEMO_PROGRAMMES.length} filières disponibles pour comparer les ratios et programmes d'études.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">2</span>
                <span>Ajuster tes priorités</span>
              </div>
              <p className="text-xs text-slate-300">
                Raffine tes mots-clés métiers ou tes préférences universitaires dans ton profil.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-indigo-400 text-sm">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">3</span>
                <span>Préparer ta sélection officielle</span>
              </div>
              <p className="text-xs text-slate-300">
                Garde ta shortlist à portée de main avant l'ouverture des dépôts sur les plateformes officielles.
              </p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. NOTE DE TRANSPARENCE OBLIGATOIRE                                       */}
        {/* ========================================================================= */}
        <TransparencyBadge variant="banner" />

      </div>
    </div>
  );
};

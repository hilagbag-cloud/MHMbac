/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page d'accueil publique (Hero, Carousel 5 étapes, 2 Blocs CTA, Aperçu Filières)
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Award,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Percent,
  Flame,
  CheckCircle2,
  Users,
  Building,
  Target,
  BookOpen,
} from 'lucide-react';
import { HeroCarousel } from '../components/HeroCarousel';
import { TransparencyBadge } from '../components/TransparencyBadge';
import { ProgrammeCard } from '../components/ProgrammeCard';
import { DEMO_PROGRAMMES } from '../lib/demoData';
import { rankProgrammes } from '../lib/ranking';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';
import { useAuth } from '../context/AuthContext';
import { formatFreshness, useLiveProgrammes } from '../lib/liveProgrammes';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user, profile, preferences, switchDemoPersona } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'tous' | 'bourse' | 'carriere'>('tous');
  const live = useLiveProgrammes(60);

  // Génération des recommandations initiales basées sur le profil actuel ou démo
  const ranked = rankProgrammes(
    DEMO_PROGRAMMES,
    profile || { series: 'D', mention: 'Bien' },
    preferences || { primary_goal: 'carriere', career_keywords: ['Informatique', 'Santé', 'Agriculture'] }
  );

  const filteredProgrammes = ranked.filter((p) => {
    if (activeFilter === 'bourse') return p.programme.demoStats.scholarshipRatio >= 0.50;
    if (activeFilter === 'carriere') return p.careerScore >= 70;
    return true;
  }).slice(0, 6);

  const handleStartWithGoal = (goal: 'bourse' | 'carriere') => {
    if (user) {
      navigate('/onboarding');
    } else {
      navigate('/register');
    }
  };

  const scrollToMethod = () => {
    const el = document.getElementById('method-carousel-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* ========================================================================= */}
      {/* 1. SECTION HERO                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800">
        
        {/* Cercles de fond subtils */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Badge de présentation */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Plateforme d'Orientation Post-BAC • MHM SOLUTIONS</span>
            </div>

            {/* Titre Principal */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white leading-[1.1]">
              Ton orientation commence par une{' '}
              <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300 bg-clip-text text-transparent italic">
                bonne décision.
              </span>
            </h1>

            {/* Sous-Titre */}
            <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              {MHM_PROMOTION_CONFIG.subheadline}
            </p>

            {/* Actions Hero */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                id="hero-start-btn"
                onClick={() => handleStartWithGoal('carriere')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span>Commencer mon parcours</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-method-btn"
                onClick={scrollToMethod}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm sm:text-base bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Découvrir la méthode</span>
              </button>
            </div>

            {/* Signature du créateur */}
            <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Initiative fondée par <strong className="text-white">{MHM_PROMOTION_CONFIG.creatorName}</strong> ({MHM_PROMOTION_CONFIG.creatorTitle})
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CAROUSEL D'INTRODUCTION (5 ÉTAPES)                                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <HeroCarousel onStartOnboarding={() => handleStartWithGoal('carriere')} />
      </section>

      {/* ========================================================================= */}
      {/* 3. DEUX BLOCS D'ORIENTATION CLÉS                                           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
            Deux approches sur-mesure pour ton avenir
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Choisis la priorité qui correspond à ta situation financière et à tes aspirations professionnelles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Bloc 1: Maximiser mes chances de bourse */}
          <div
            id="cta-block-bourse"
            className="group rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 text-white shadow-xl hover:border-emerald-500/60 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
                <Percent className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Option Sécurité & Financement
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                  Maximiser mes chances de bourse
                </h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                Je veux privilégier les filières où le rapport entre bourses disponibles et concurrence semble favorable, afin de sécuriser le financement de mes études universitaires.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Analyse approfondie des quotas et ratios de bourses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Repérage des filières techniques à haute attribution</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <button
                id="btn-choose-bourse"
                onClick={() => handleStartWithGoal('bourse')}
                className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
              >
                <span>Choisir l’objectif Bourse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bloc 2: Construire mon parcours carrière */}
          <div
            id="cta-block-carriere"
            className="group rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 p-6 sm:p-8 text-white shadow-xl hover:border-rose-500/60 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-md">
                <Target className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Option Métier & Passion
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                  Construire mon parcours carrière
                </h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                Je veux choisir des filières cohérentes avec un métier ou un domaine professionnel précis (informatique, santé, agrobusiness, génie civil, droit...).
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Alignement sur les compétences clés du marché</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Débouchés professionnels certifiés et filières d’élite</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <button
                id="btn-choose-carriere"
                onClick={() => handleStartWithGoal('carriere')}
                className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2"
              >
                <span>Choisir l’objectif Carrière</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Note de Transparence */}
        <div className="mt-8">
          <TransparencyBadge />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DONNÉES OBSERVÉES EN DIRECT                                             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 dark:border-slate-800" id="live-rankings">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Données publiques observées</div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white">Classements et jauges en temps réel</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Les données affichées proviennent des relevés reçus par MHM SOLUTIONS. Elles ne garantissent ni admission ni bourse.</p>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${live.realtime === 'connected' ? 'border-emerald-400/40 text-emerald-600 dark:text-emerald-300' : 'border-slate-300 dark:border-slate-700'}`}>
              <span className={`w-2 h-2 rounded-full ${live.realtime === 'connected' ? 'bg-emerald-500' : live.realtime === 'error' ? 'bg-rose-500' : 'bg-slate-400'}`} />
              {live.realtime === 'connected' ? 'Realtime connecté' : live.realtime === 'disabled' ? 'Supabase non configuré' : live.realtime === 'error' ? 'Lecture live indisponible' : 'Connexion en cours'}
            </div>
            <div className="mt-2">Dernière collecte : {formatFreshness(live.lastUpdated)}</div>
          </div>
        </div>
        {live.loading && <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">Chargement des relevés observés…</div>}
        {!live.loading && live.error && <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-6 text-sm text-rose-700 dark:text-rose-300">Lecture live indisponible : {live.error}</div>}
        {!live.loading && !live.error && live.rows.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">Aucun relevé réel disponible pour le moment. Lancez un scan depuis l’extension MHM SOLUTIONS pour alimenter cette section.</div>}
        {!live.loading && !live.error && live.rows.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {live.rows.slice(0, 9).map((row) => <article key={row.programme_id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Observée</div><h3 className="mt-1 font-bold text-slate-900 dark:text-white">{row.programme}</h3></div><div className="text-right"><div className="text-2xl font-black text-rose-500">{row.score_opportunity ?? '—'}</div><div className="text-[10px] uppercase text-slate-400">score /100</div></div></div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{row.university} · {row.school}</p>
            <div className="grid grid-cols-3 gap-2 mt-5 text-center text-xs"><div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><strong className="block text-slate-900 dark:text-white">{row.scholarships}</strong><span className="text-slate-500">bourses</span></div><div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><strong className="block text-slate-900 dark:text-white">{row.passable}</strong><span className="text-slate-500">Passable</span></div><div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><strong className="block text-slate-900 dark:text-white">{row.total}</strong><span className="text-slate-500">inscrits</span></div></div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>{row.rank != null ? `Rang observé #${row.rank}` : 'Rang non disponible'}</span><span>Confiance {row.score_confidence || 'limitée'}</span></div>
          </article>)}
        </div>}
      </section>

      {/* ========================================================================= */}
      {live.rows.length > 0 && <>
      {/* 5. APERÇU DES RECOMMANDATIONS DU MVP1                                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 dark:border-slate-800">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
              Démonstration Algorithmique
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white">
              Exemples de filières analysées par MHM
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Affichage calibré pour un bachelier en Série {profile?.series || 'D'} ({profile?.mention || 'Mention Bien'}).
            </p>
          </div>

          {/* Filtres de démonstration */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveFilter('tous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'tous'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toutes les filières ({DEMO_PROGRAMMES.length})
            </button>
            <button
              onClick={() => setActiveFilter('bourse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'bourse'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Haut ratio Bourses
            </button>
            <button
              onClick={() => setActiveFilter('carriere')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'carriere'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Top Carrières
            </button>
          </div>
        </div>

        {/* Grille des cartes de filières */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProgrammes.map((p) => (
            <ProgrammeCard key={p.programme.id} item={p} />
          ))}
        </div>

        {/* Bouton pour aller au tableau de bord complet */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/onboarding')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-md"
          >
            <span>Accéder au tableau de bord complet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
      </>}

      {/* ========================================================================= */}
      {/* 6. PRÉSENTATION MHM SOLUTIONS & HILARUS GBAGOULE                            */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                L’Équipe & La Vision
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white">
                Une initiative pensée pour la réussite des bacheliers
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {MHM_PROMOTION_CONFIG.mission}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-colors"
                >
                  <span>En savoir plus sur MHM SOLUTIONS et Hilarus GBAGOULE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fondateur du projet
              </div>
              <div className="text-lg font-bold text-white">
                {MHM_PROMOTION_CONFIG.creatorName}
              </div>
              <div className="text-xs text-rose-400 font-medium">
                {MHM_PROMOTION_CONFIG.creatorTitle}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-700">
                Dévoué à concevoir des solutions technologiques à fort impact pour la jeunesse et l'enseignement supérieur.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Parcours de personnalisation initiale (Onboarding en 4 étapes avec feedback encourageant)
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Target,
  Percent,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  Compass,
} from 'lucide-react';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';
import { DOMAIN_SUGGESTIONS } from '../lib/demoData';
import { EncouragementBanner } from '../components/EncouragementBanner';
import { TransparencyBadge } from '../components/TransparencyBadge';
import { useAuth } from '../context/AuthContext';

interface OnboardingPageProps {
  navigate: (route: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ navigate }) => {
  const { profile, preferences, updateProfile, updatePreferences } = useAuth();

  // Étape courante (A: 0, B: 1, C: 2, D: 3)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // État local du formulaire d'onboarding
  const [selectedSeries, setSelectedSeries] = useState<BacSeries | null>(
    (profile?.series as BacSeries) || 'D'
  );
  const [selectedMention, setSelectedMention] = useState<BacMention | null>(
    (profile?.mention as BacMention) || 'Bien'
  );
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal>(
    preferences?.primary_goal || 'carriere'
  );
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    preferences?.career_keywords || ['Informatique', 'Génie Logiciel']
  );
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const seriesOptions: { code: BacSeries; label: string; desc: string }[] = [
    { code: 'D', label: 'Série D', desc: 'Sciences de la Vie et de la Terre, Mathématiques & Physique' },
    { code: 'C', label: 'Série C', desc: 'Mathématiques & Sciences Physiques approfondies' },
    { code: 'A', label: 'Série A (A1, A2)', desc: 'Lettres, Philosophie, Langues & Sciences Humaines' },
    { code: 'B', label: 'Série B', desc: 'Économie, Gestion & Sciences Sociales' },
    { code: 'E', label: 'Série E', desc: 'Mathématiques & Techniques Industrielles' },
    { code: 'Autre', label: 'Autre Série / Bac Pro', desc: 'Séries G1, G2, F, TAA ou équivalent international' },
  ];

  const mentionOptions: { code: BacMention; label: string; tag: string }[] = [
    { code: 'Passable', label: 'Passable (10 - 11.99)', tag: 'Admis' },
    { code: 'Assez bien', label: 'Assez bien (12 - 13.99)', tag: 'Favorable' },
    { code: 'Bien', label: 'Bien (14 - 15.99)', tag: 'Très Favorable' },
    { code: 'Très bien', label: 'Très bien (16/20 et +)', tag: 'Élite & Bourse' },
  ];

  const handleAddKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      setSelectedKeywords([...selectedKeywords, trimmed]);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== kw));
  };

  const handleCustomKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKeywordInput.trim()) {
      handleAddKeyword(customKeywordInput);
      setCustomKeywordInput('');
    }
  };

  // Passer à l'étape suivante
  const nextStep = () => {
    if (currentStep === 1 && selectedGoal === 'bourse') {
      // Si l'utilisateur choisit Bourse, on peut aller directement à la confirmation ou suggérer des domaines
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.min(3, prev + 1));
    }
  };

  // Revenir en arrière
  const prevStep = () => {
    if (currentStep === 3 && selectedGoal === 'bourse') {
      setCurrentStep(1);
    } else {
      setCurrentStep((prev) => Math.max(0, prev - 1));
    }
  };

  // Validation Finale et Sauvegarde
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        series: selectedSeries,
        mention: selectedMention,
      });

      await updatePreferences({
        primary_goal: selectedGoal,
        career_keywords: selectedKeywords,
        scholarship_priority: selectedGoal === 'bourse' ? 85 : 50,
        career_priority: selectedGoal === 'carriere' ? 90 : 50,
        competition_priority: 50,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur sauvegarde onboarding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 sm:py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Barre de progression des 4 étapes */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Personnalisation de ton orientation</span>
            <span>Étape {currentStep + 1} sur 4</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {['Profil scolaire', 'Objectif', 'Domaine métier', 'Confirmation'].map((label, idx) => (
              <div key={idx} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentStep
                      ? 'bg-gradient-to-r from-rose-500 to-indigo-600'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <span className="hidden sm:block text-[11px] font-medium text-slate-400 truncate">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bannière de feedback encourageant dynamique */}
        <div className="mb-8">
          <EncouragementBanner
            series={selectedSeries}
            mention={selectedMention}
            goal={selectedGoal}
            domain={selectedKeywords[0]}
          />
        </div>

        {/* Conteneur principal de l'étape */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl transition-all">
          
          {/* ========================================================================= */}
          {/* ÉTAPE A : PROFIL SCOLAIRE (Série & Mention)                              */}
          {/* ========================================================================= */}
          {currentStep === 0 && (
            <div id="step-a-container" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
                  Étape A — Profil scolaire
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  Quelle est ta série au Baccalauréat ?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Cette information permet d’identifier les filières admissibles pour ton cursus.
                </p>
              </div>

              {/* Grille des Séries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {seriesOptions.map((opt) => (
                  <button
                    key={opt.code}
                    id={`series-opt-${opt.code}`}
                    onClick={() => setSelectedSeries(opt.code)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedSeries === opt.code
                        ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500 text-rose-900 dark:text-rose-200 shadow-md ring-2 ring-rose-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      {selectedSeries === opt.code && (
                        <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Section Mention */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Quelle mention as-tu obtenue ?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Les mentions supérieures débloquent des priorités d'allocations et des bonus d'adéquation.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {mentionOptions.map((opt) => (
                    <button
                      key={opt.code}
                      id={`mention-opt-${opt.code}`}
                      onClick={() => setSelectedMention(opt.code)}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        selectedMention === opt.code
                          ? 'bg-indigo-500/15 dark:bg-indigo-500/25 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-md ring-2 ring-indigo-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {opt.code}
                      </div>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mt-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60">
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE B : OBJECTIF PRINCIPAL                                              */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div id="step-b-container" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
                  Étape B — Objectif principal
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  Quel est ton objectif prioritaire pour cette année ?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Tu pourras affiner ce choix à tout moment depuis ton tableau de bord.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Choix 1: Bourse */}
                <button
                  id="goal-opt-bourse"
                  onClick={() => setSelectedGoal('bourse')}
                  className={`p-6 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                    selectedGoal === 'bourse'
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500 shadow-xl ring-2 ring-emerald-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-md">
                      <Percent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Maximiser mes chances de bourse
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Je veux privilégier les filières où le rapport entre bourses disponibles et concurrence semble favorable.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Priorité Financement & Sécurité</span>
                    {selectedGoal === 'bourse' && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </button>

                {/* Choix 2: Carrière */}
                <button
                  id="goal-opt-carriere"
                  onClick={() => setSelectedGoal('carriere')}
                  className={`p-6 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                    selectedGoal === 'carriere'
                      ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500 shadow-xl ring-2 ring-rose-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shadow-md">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Construire mon parcours carrière
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Je veux choisir des filières cohérentes avec un métier ou un domaine professionnel précis.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <span>Priorité Métier & Vocation</span>
                    {selectedGoal === 'carriere' && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE C : DOMAINE PROFESSIONNEL                                           */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div id="step-c-container" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
                  Étape C — Domaine professionnel
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  Quels domaines ou métiers t’intéressent ?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sélectionne parmi nos suggestions ou saisis tes propres centres d'intérêt.
                </p>
              </div>

              {/* Mots-clés Actuellement Sélectionnés */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Tes domaines / métiers sélectionnés ({selectedKeywords.length})
                </label>
                
                {selectedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    {selectedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-sm"
                      >
                        <span>{kw}</span>
                        <button
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:bg-rose-600 rounded-full p-0.5 transition-colors"
                          aria-label={`Supprimer ${kw}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                    Veuillez sélectionner au moins un domaine ci-dessous pour affiner vos recommandations métiers.
                  </div>
                )}
              </div>

              {/* Saisie Libre */}
              <form onSubmit={handleCustomKeywordSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Intelligence Artificielle, Droit Notarial, Énergies Solaires..."
                  value={customKeywordInput}
                  onChange={(e) => setCustomKeywordInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </form>

              {/* Suggestions Populaires */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Suggestions de domaines MHM SOLUTIONS
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DOMAIN_SUGGESTIONS.map((dom) => {
                    const isSelected = selectedKeywords.includes(dom.name) || selectedKeywords.includes(dom.popularCareers[0]);
                    return (
                      <button
                        key={dom.id}
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveKeyword(dom.name);
                          } else {
                            handleAddKeyword(dom.name);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{dom.name}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE D : CONFIRMATION & RÉSUMÉ                                           */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div id="step-d-container" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
                  Étape D — Confirmation
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  Vérifie le résumé de ton profil
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Ces paramètres serviront à calculer ton premier tableau de bord de recommandations.
                </p>
              </div>

              {/* Résumé des Choix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Série & Mention
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    Série {selectedSeries}
                  </div>
                  <div className="text-xs text-rose-500 font-semibold">
                    Mention {selectedMention}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Objectif Principal
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedGoal === 'bourse' ? 'Bourses d’Études' : 'Parcours Carrière'}
                  </div>
                  <div className="text-xs text-emerald-500 font-semibold">
                    {selectedGoal === 'bourse' ? 'Maximisation quotas' : 'Affinité métier'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Domaines & Métiers
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedKeywords.length > 0 ? selectedKeywords.join(', ') : 'Généraliste'}
                  </div>
                  <div className="text-xs text-indigo-400 font-semibold">
                    {selectedKeywords.length} mot(s)-clé(s)
                  </div>
                </div>

              </div>

              {/* Note de Transparence */}
              <TransparencyBadge />

            </div>
          )}

          {/* ========================================================================= */}
          {/* BOUTONS DE NAVIGATION INTER-ÉTAPES                                        */}
          {/* ========================================================================= */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            
            {currentStep > 0 ? (
              <button
                id="onboarding-prev-btn"
                onClick={prevStep}
                className="px-5 py-3 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                id="onboarding-next-btn"
                onClick={nextStep}
                className="px-7 py-3 rounded-2xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="onboarding-submit-btn"
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="px-8 py-3.5 rounded-2xl text-base font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/50 flex items-center gap-2 hover:scale-105 disabled:opacity-50 transition-all"
              >
                <span>{isSaving ? 'Génération en cours...' : 'Accéder à mon tableau de bord'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

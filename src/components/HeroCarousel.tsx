/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Carousel d'introduction en 5 étapes avec préchargement, autoplay, pause et respect du prefers-reduced-motion
 * Créateur : Hilarus GBAGOULE
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  UserCheck,
  Target,
  BarChart3,
  ListOrdered,
  BellRing,
  ArrowRight,
} from 'lucide-react';

interface CarouselStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeText: string;
  previewGraphic: {
    tag: string;
    details: string[];
  };
}

const CAROUSEL_STEPS: CarouselStep[] = [
  {
    id: 1,
    title: '1. Je renseigne mon profil',
    subtitle: 'Série, mention et préférences',
    description:
      'Indique ta série de BAC (D, C, A, B, E...), ta mention obtenue et tes affinités. L’algorithme calibre instantanément les débouchés adaptés à ton cursus.',
    icon: UserCheck,
    accentColor: 'from-blue-600 to-indigo-600',
    badgeText: 'Étape Fondatrice',
    previewGraphic: {
      tag: 'Profil Académique',
      details: ['Série D / C / A / B / E', 'Mention Passable à Très Bien', 'Compatibilité directe'],
    },
  },
  {
    id: 2,
    title: '2. Je choisis mon objectif',
    subtitle: 'Bourse ou parcours carrière',
    description:
      'Définis ta priorité numéro 1 : maximiser tes opportunités de financement (bourses/allocations) ou cibler un métier d’avenir précis sans compromis.',
    icon: Target,
    accentColor: 'from-rose-500 to-amber-500',
    badgeText: 'Stratégie Personnalisée',
    previewGraphic: {
      tag: 'Double Voie',
      details: ['Priorité Bourse & Sécurité', 'Parcours Métier & Passion', 'Pondération intelligente'],
    },
  },
  {
    id: 3,
    title: '3. Je compare les possibilités',
    subtitle: 'Jauges, bourses et concurrence',
    description:
      'Visualise pour chaque filière le ratio d’admis boursiers, la tension de concurrence et l’adéquation réelle avec les exigences du marché de l’emploi.',
    icon: BarChart3,
    accentColor: 'from-emerald-500 to-teal-600',
    badgeText: 'Analyse Claire',
    previewGraphic: {
      tag: 'Indicateurs Transparents',
      details: ['Ratio bourses estimé (ex: 67%)', 'Indice de sélectivité', 'Données de démonstration MVP1'],
    },
  },
  {
    id: 4,
    title: '4. Je construis ma shortlist',
    subtitle: 'Les options les plus adaptées',
    description:
      'Retiens les 3 à 5 meilleures filières correspondant à ta stratégie. Classe-les en vue de tes choix définitifs sur les plateformes universitaires officielles.',
    icon: ListOrdered,
    accentColor: 'from-indigo-600 to-purple-600',
    badgeText: 'Prise de Décision',
    previewGraphic: {
      tag: 'Sélection Finale',
      details: ['Recommandations par affinité', 'Fiches filières détaillées', 'Validation sereine'],
    },
  },
  {
    id: 5,
    title: '5. Je suis les évolutions',
    subtitle: 'Les données pourront être actualisées plus tard',
    description:
      'Une architecture prête à accueillir les futures synchronisations de jauges en direct, l’extension Chrome MHM et les flux automatisés n8n.',
    icon: BellRing,
    accentColor: 'from-cyan-600 to-blue-700',
    badgeText: 'Évolutif & Connecté',
    previewGraphic: {
      tag: 'Phases Suivantes',
      details: ['Extension Chrome dédiée', 'Workflows n8n préparés', 'Alertes en temps réel'],
    },
  },
];

interface HeroCarouselProps {
  onStartOnboarding: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onStartOnboarding }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  // Vérifier les préférences reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isPlaying && !prefersReducedMotion) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % CAROUSEL_STEPS.length);
      }, 5500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, prefersReducedMotion]);

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + CAROUSEL_STEPS.length) % CAROUSEL_STEPS.length);
  };

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % CAROUSEL_STEPS.length);
  };

  const step = CAROUSEL_STEPS[currentStep];
  const IconComponent = step.icon;

  return (
    <div id="method-carousel-section" className="relative w-full max-w-5xl mx-auto my-6 sm:my-10">
      
      {/* Conteneur principal du Carousel */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800/80 shadow-2xl p-6 sm:p-10 text-white">
        
        {/* Éléments d'arrière-plan avec dégradé subtil */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* En-tête de la méthode */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              La Méthode MHM SOLUTIONS en 5 étapes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Mettre en pause' : 'Reprendre le défilement'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Corps de la diapositive active */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[300px]">
          
          {/* Texte et détails */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {step.badgeText}
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-rose-400 mt-1">
                {step.subtitle}
              </p>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {step.description}
            </p>

            <div className="pt-2">
              <button
                onClick={onStartOnboarding}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition-all hover:gap-3"
              >
                <span>Commencer ce parcours</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carte visuelle dynamique de démonstration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 p-5 shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${step.accentColor} text-white shadow-md`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{step.previewGraphic.tag}</div>
                    <div className="text-[11px] text-slate-400">Aperçu interactif</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  0{step.id}/05
                </span>
              </div>

              <div className="space-y-2.5">
                {step.previewGraphic.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                    <span className="truncate">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles de navigation : Boutons et Indicateurs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800">
          
          {/* Indicateurs de position (Pills) */}
          <div className="flex items-center gap-2">
            {CAROUSEL_STEPS.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                aria-label={`Aller à l'étape ${s.id}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep === index
                    ? 'w-8 bg-rose-500'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Boutons Précédent / Suivant */}
          <div className="flex items-center gap-3">
            <button
              id="carousel-prev-btn"
              onClick={handlePrev}
              aria-label="Étape précédente"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-medium text-slate-400">
              Étape {currentStep + 1} sur {CAROUSEL_STEPS.length}
            </span>

            <button
              id="carousel-next-btn"
              onClick={handleNext}
              aria-label="Étape suivante"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

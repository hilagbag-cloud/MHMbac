/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Carte de filière enrichie avec jauges, scores et note de démonstration
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Briefcase,
  TrendingUp,
  Percent,
  Flame,
  CheckCircle2,
  Info,
  X,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { ScoredProgramme } from '../types/orientation';

interface ProgrammeCardProps {
  item: ScoredProgramme;
  onSelect?: (item: ScoredProgramme) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (item: ScoredProgramme) => void;
}

export const ProgrammeCard: React.FC<ProgrammeCardProps> = ({
  item,
  isShortlisted = false,
  onToggleShortlist,
}) => {
  const [showModal, setShowModal] = useState(false);
  const { programme, score, compatibilityScore, scholarshipScore, careerScore, badge, reasons } = item;

  // Calcul visuel du ratio de bourses
  const scholarshipPct = Math.round(programme.demoStats.scholarshipRatio * 100);

  // Variante de badge
  const badgeColors = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <>
      <div
        id={`prog-card-${programme.id}`}
        className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        {/* En-tête de la carte */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                badgeColors[badge.variant] || badgeColors.indigo
              }`}
            >
              {badge.label}
            </span>

            {/* Score Composite MHM */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs sm:text-sm font-bold shadow-sm">
              <span className="text-rose-400">Score</span>
              <span>{score}/100</span>
            </div>
          </div>

          {/* Titre & Établissement */}
          <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors tracking-tight">
            {programme.programme}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{programme.school}</span>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">
            {programme.university}
          </div>

          {/* Séries Admissibles */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Séries :</span>
            {programme.admissibleSeries.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Jauges Clés d'Orientation (MVP1) */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            
            {/* Jauge Bourses */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-500" />
                  Ratio d’admis boursiers estimé
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {scholarshipPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${scholarshipPct}%` }}
                />
              </div>
            </div>

            {/* Jauge Concurrence */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Niveau de concurrence
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {programme.demoStats.competitionLevel} ({programme.demoStats.competitionScore}/10)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    programme.demoStats.competitionScore >= 8
                      ? 'bg-rose-500'
                      : programme.demoStats.competitionScore >= 5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${programme.demoStats.competitionScore * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions en bas de carte */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Détails & Analyse</span>
          </button>

          {onToggleShortlist && (
            <button
              onClick={() => onToggleShortlist(item)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isShortlisted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
              }`}
            >
              {isShortlisted ? '✓ Dans ma shortlist' : '+ Ajouter'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Fiche Détaillée & Justification */}
      {showModal && (
        <div
          id={`prog-modal-${programme.id}`}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
            
            {/* Bouton Fermer */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer la modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête Modal */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
                {programme.domain}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {programme.programme}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {programme.school} — {programme.university}
              </p>
            </div>

            {/* Note de Transparence Démo */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <strong>Données de démonstration :</strong> Les chiffres et ratios ci-dessous sont générés pour illustrer l’algorithme MHM et seront actualisés avec les jauges réelles dans les prochaines versions.
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {programme.description || 'Formation universitaire supérieure complète.'}
            </p>

            {/* Justification de la Recommandation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pourquoi cette filière correspond à ton profil :
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                {reasons.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Débouchés Métiers */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Débouchés & Métiers Cibles
              </h4>
              <div className="flex flex-wrap gap-2">
                {programme.demoStats.sampleCareers.map((career, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>

            {/* Matières Clés */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-rose-400" />
                Matières Clés & Socle
              </h4>
              <div className="flex flex-wrap gap-2">
                {programme.demoStats.keySubjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* Bouton de Fermeture */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

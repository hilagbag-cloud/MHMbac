/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Badge de transparence et d'avertissement sur les données de démonstration
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface TransparencyBadgeProps {
  className?: string;
  variant?: 'banner' | 'pill' | 'card';
}

export const TransparencyBadge: React.FC<TransparencyBadgeProps> = ({
  className = '',
  variant = 'banner',
}) => {
  if (variant === 'pill') {
    return (
      <span
        id="demo-transparency-pill"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
        <span>Données de démonstration MVP1</span>
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div
        id="demo-transparency-card"
        className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs sm:text-sm space-y-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Note de transparence méthodologique (MVP1)</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
          <strong>Données de démonstration</strong> — la synchronisation réelle sera activée dans une prochaine version. MHM SOLUTIONS ne garantit aucune admission ou bourse.
        </p>
      </div>
    );
  }

  return (
    <div
      id="demo-transparency-banner"
      className={`p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <div className="font-bold text-amber-900 dark:text-amber-300">
          Données de démonstration — la synchronisation réelle sera activée dans une prochaine version.
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
          Toutes les capacités, ratios de bourses et indices de concurrence affichés dans ce prototype sont des estimations calibrées pour tester le parcours et l'algorithme d'orientation. Aucune donnée inventée n’est présentée comme officielle.
        </p>
      </div>
    </div>
  );
};

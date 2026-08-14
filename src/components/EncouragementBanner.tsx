/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Bannière de feedback interactif et encourageant lors de l'onboarding
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { Sparkles, Award, Flame, Zap, ThumbsUp, Heart } from 'lucide-react';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';

interface EncouragementBannerProps {
  series?: BacSeries | null;
  mention?: BacMention | null;
  goal?: PrimaryGoal | null;
  domain?: string | null;
}

export const getEncouragementMessage = (
  series?: BacSeries | null,
  mention?: BacMention | null,
  goal?: PrimaryGoal | null,
  domain?: string | null
): { title: string; subtitle: string; icon: any; color: string } => {
  if (mention === 'Très bien') {
    return {
      title: 'WOW, le crack absolu ! 🚀',
      subtitle:
        'Mention Très Bien : un profil d’élite qui t’ouvre grand les portes des bourses d’excellence et des filières les plus sélectives.',
      icon: Flame,
      color: 'from-amber-500 to-rose-600',
    };
  }

  if (mention === 'Bien') {
    return {
      title: 'Chapeau bas ! Excellent travail ! 🎓',
      subtitle:
        'Mention Bien : ton dossier possède un fort avantage compétitif pour décrocher une allocation ou intégrer une école d’ingénieurs / santé.',
      icon: Award,
      color: 'from-emerald-500 to-teal-600',
    };
  }

  if (series === 'C' || series === 'E') {
    return {
      title: 'Profil scientifique & logique pointu ! ⚡',
      subtitle:
        `Série ${series} : un socle mathématique robuste particulièrement recherché en génie logiciel, BTP, sciences physiques et recherche.`,
      icon: Zap,
      color: 'from-indigo-500 to-cyan-600',
    };
  }

  if (series === 'D') {
    return {
      title: 'La polyvalence scientifique par excellence ! 🌱',
      subtitle:
        'Série D : la clé royale pour la médecine, l’agronomie de pointe, les biotechnologies et les sciences numériques.',
      icon: Sparkles,
      color: 'from-emerald-600 to-green-600',
    };
  }

  if (series === 'A' || series === 'B') {
    return {
      title: 'Visionnaire & stratège ! ⚖️',
      subtitle:
        `Série ${series} : excellente maîtrise de l’expression, de l’analyse et de la dialectique, idéale pour le droit, la diplomatie et le management.`,
      icon: ThumbsUp,
      color: 'from-purple-500 to-indigo-600',
    };
  }

  if (goal === 'bourse') {
    return {
      title: 'Stratégie financière pragmatique ! 💡',
      subtitle:
        'Maximiser ses chances de bourse : l’algorithme MHM va privilégier les filières au ratio bourses/places le plus favorable.',
      icon: Sparkles,
      color: 'from-rose-500 to-pink-600',
    };
  }

  if (goal === 'carriere') {
    return {
      title: 'L’ambition guidée par la passion ! 🎯',
      subtitle:
        'Construire ton parcours carrière : nous ciblons les cursus en prise directe avec les métiers de demain et tes talents.',
      icon: Heart,
      color: 'from-indigo-600 to-rose-500',
    };
  }

  return {
    title: 'Hum, très intéressant ! 🌟',
    subtitle: 'Chaque choix affine ton orientation personnalisée pour construire un avenir solide.',
    icon: Sparkles,
    color: 'from-slate-700 to-slate-900',
  };
};

export const EncouragementBanner: React.FC<EncouragementBannerProps> = ({
  series,
  mention,
  goal,
  domain,
}) => {
  const data = getEncouragementMessage(series, mention, goal, domain);
  const IconComp = data.icon;

  return (
    <div
      id="onboarding-encouragement-box"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${data.color} text-white shadow-md flex-shrink-0`}>
        <IconComp className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-base sm:text-lg text-white font-sans">
          {data.title}
        </h4>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {data.subtitle}
        </p>
      </div>
    </div>
  );
};

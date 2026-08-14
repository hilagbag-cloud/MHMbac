/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Algorithme de classement et d'adéquation (Fonction pure & testable)
 * Créateur : Hilarus GBAGOULE
 */

import {
  BacMention,
  BacSeries,
  DemoProgramme,
  PrimaryGoal,
  ScoredProgramme,
  UserPreferences,
  UserProfile,
} from '../types/orientation';

export interface RankingWeights {
  scholarshipWeight: number; // 0 à 1
  careerWeight: number;      // 0 à 1
  competitionWeight: number; // 0 à 1
}

/**
 * Calcule l'adéquation d'une série avec une filière
 */
export function calculateSeriesCompatibility(
  series: BacSeries | null | undefined,
  admissibleSeries: BacSeries[]
): { score: number; isAdmissible: boolean; note: string } {
  if (!series) {
    return { score: 70, isAdmissible: true, note: 'Série non spécifiée' };
  }

  const index = admissibleSeries.indexOf(series);
  if (index === 0) {
    return { score: 100, isAdmissible: true, note: 'Série prioritaire idéale' };
  } else if (index > 0) {
    // Admissible mais après la série reine
    const score = Math.max(65, 95 - index * 10);
    return { score, isAdmissible: true, note: 'Série compatible et acceptée' };
  } else if (series === 'Autre') {
    return { score: 50, isAdmissible: true, note: 'Étude sur dossier requise' };
  }

  return { score: 20, isAdmissible: false, note: 'Série non recommandée pour cette filière' };
}

/**
 * Calcule le coefficient de mention
 */
export function getMentionBonus(mention: BacMention | null | undefined): number {
  switch (mention) {
    case 'Très bien':
      return 15;
    case 'Bien':
      return 10;
    case 'Assez bien':
      return 5;
    case 'Passable':
    default:
      return 0;
  }
}

/**
 * Calcule le score d'opportunité de bourse (0 à 100)
 */
export function calculateScholarshipScore(programme: DemoProgramme): number {
  const ratio = programme.demoStats.scholarshipRatio; // ex: 0.72
  const compScore = programme.demoStats.competitionScore; // 1 à 10 (10 = hyper concurrentiel)

  // Plus le ratio de bourse est élevé et moins la concurrence est rude, plus le score est haut
  const ratioScore = Math.min(100, Math.round(ratio * 100));
  const compEaseBonus = (10 - compScore) * 3; // 0 à 27 points

  return Math.min(100, Math.max(0, Math.round(ratioScore * 0.75 + compEaseBonus)));
}

/**
 * Calcule le score d'adéquation de carrière / domaine (0 à 100)
 */
export function calculateCareerScore(
  programme: DemoProgramme,
  careerKeywords: string[]
): { score: number; matchedKeywords: string[] } {
  if (!careerKeywords || careerKeywords.length === 0) {
    return { score: 60, matchedKeywords: [] };
  }

  const matchedKeywords: string[] = [];
  const normalizedProg = `${programme.programme} ${programme.domain} ${programme.school} ${programme.demoStats.sampleCareers.join(' ')}`.toLowerCase();

  for (const keyword of careerKeywords) {
    const normKw = keyword.trim().toLowerCase();
    if (normKw && normalizedProg.includes(normKw)) {
      matchedKeywords.push(keyword);
    }
  }

  if (matchedKeywords.length >= 2) {
    return { score: 98, matchedKeywords };
  } else if (matchedKeywords.length === 1) {
    return { score: 88, matchedKeywords };
  }

  // Vérifier si le domaine général a des racines communes
  const hasPartialDomain = careerKeywords.some((kw) =>
    programme.domain.toLowerCase().includes(kw.toLowerCase().slice(0, 4))
  );

  return {
    score: hasPartialDomain ? 70 : 40,
    matchedKeywords,
  };
}

/**
 * Fonction PURE principale de calcul des scores et de tri des filières
 */
export function rankProgrammes(
  programmes: DemoProgramme[],
  profile: Partial<UserProfile> | null,
  preferences: Partial<UserPreferences> | null
): ScoredProgramme[] {
  const goal: PrimaryGoal = preferences?.primary_goal || 'carriere';
  const series: BacSeries = (profile?.series as BacSeries) || 'D';
  const mention: BacMention = (profile?.mention as BacMention) || 'Assez bien';
  const keywords = preferences?.career_keywords || [];

  // Poids adaptatifs selon l'objectif choisi
  const isBourse = goal === 'bourse';
  const weightScholarship = isBourse ? 0.50 : 0.20;
  const weightCareer = isBourse ? 0.20 : 0.50;
  const weightSeries = 0.30;

  const mentionBonus = getMentionBonus(mention);

  const scoredList: ScoredProgramme[] = programmes.map((prog) => {
    const seriesEval = calculateSeriesCompatibility(series, prog.admissibleSeries);
    const scholarshipScore = calculateScholarshipScore(prog);
    const careerEval = calculateCareerScore(prog, keywords);

    // Score brut pondéré
    let rawScore =
      seriesEval.score * weightSeries +
      scholarshipScore * weightScholarship +
      careerEval.score * weightCareer;

    // Bonus de mention appliqué si la série est admissible
    if (seriesEval.isAdmissible) {
      rawScore += mentionBonus;
    }

    const finalScore = Math.min(100, Math.max(10, Math.round(rawScore)));

    // Raisons explicatives pour la transparence
    const reasons: string[] = [];
    reasons.push(seriesEval.note);

    if (isBourse) {
      if (prog.demoStats.scholarshipRatio >= 0.55) {
        reasons.push(`Ratio de bourses favorable (${Math.round(prog.demoStats.scholarshipRatio * 100)}% d’admis boursiers simulés).`);
      } else {
        reasons.push(`Filière sélective sur bourses (${Math.round(prog.demoStats.scholarshipRatio * 100)}% de bourses simulées).`);
      }
    } else {
      if (careerEval.matchedKeywords.length > 0) {
        reasons.push(`Correspondance directe avec tes métiers cibles : ${careerEval.matchedKeywords.join(', ')}.`);
      } else {
        reasons.push(`Filière générale du domaine ${prog.domain}.`);
      }
    }

    if (prog.demoStats.competitionLevel === 'Faible' || prog.demoStats.competitionLevel === 'Modéré') {
      reasons.push(`Niveau de concurrence modéré (${prog.demoStats.competitionLevel}).`);
    }

    // Détermination du badge
    let badge: ScoredProgramme['badge'] = {
      label: 'Option Recommandée',
      variant: 'indigo',
    };

    if (isBourse && prog.demoStats.scholarshipRatio >= 0.60) {
      badge = { label: 'Opportunité Bourse Forte', variant: 'emerald' };
    } else if (!isBourse && careerEval.score >= 85) {
      badge = { label: 'Métier Cible Privilégié', variant: 'rose' };
    } else if (prog.demoStats.competitionScore >= 8) {
      badge = { label: 'Filière Très Sélective', variant: 'amber' };
    }

    return {
      programme: prog,
      score: finalScore,
      compatibilityScore: seriesEval.score,
      scholarshipScore,
      careerScore: careerEval.score,
      badge,
      reasons,
    };
  });

  // Tri décroissant par score
  return scoredList.sort((a, b) => b.score - a.score);
}

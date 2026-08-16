import { BacSeries, AcademicSubjectScores } from '../types/orientation';

export type RankingSubject = { key: string; label: string; coefficient: number };

// Coefficients publiés par l’Office du Baccalauréat du Bénin.
// Le guide MESRS utilise ensuite trois matières principales adaptées à la filière.
export const rankingSubjectsBySeries: Partial<Record<BacSeries, RankingSubject[]>> = {
  A1: [
    { key: 'francais', label: 'Français', coefficient: 5 },
    { key: 'philosophie', label: 'Philosophie', coefficient: 4 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 3 },
  ],
  A2: [
    { key: 'francais', label: 'Français', coefficient: 4 },
    { key: 'philosophie', label: 'Philosophie', coefficient: 3 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 5 },
  ],
  B: [
    { key: 'francais', label: 'Français', coefficient: 4 },
    { key: 'economie', label: 'Économie', coefficient: 4 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 4 },
  ],
  C: [
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 6 },
    { key: 'sciences_physiques', label: 'Sciences Physiques', coefficient: 5 },
    { key: 'svt', label: 'SVT', coefficient: 2 },
  ],
  D: [
    { key: 'svt', label: 'SVT', coefficient: 5 },
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 4 },
    { key: 'sciences_physiques', label: 'Sciences Physiques', coefficient: 4 },
  ],
  E: [
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 5 },
    { key: 'sciences_physiques', label: 'Sciences Physiques', coefficient: 4 },
    { key: 'construction_mecanique', label: 'Construction mécanique', coefficient: 3 },
  ],
};

const additionalSubjectsBySeries: Partial<Record<BacSeries, RankingSubject[]>> = {
  A1: [
    { key: 'langue_vivante_1', label: 'Langue vivante 1', coefficient: 3 },
    { key: 'langue_vivante_2', label: 'Langue vivante 2', coefficient: 2 },
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 2 },
    { key: 'svt', label: 'SVT', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
  A2: [
    { key: 'langue_vivante_1', label: 'Langue vivante 1', coefficient: 3 },
    { key: 'langue_vivante_2', label: 'Langue vivante 2', coefficient: 2 },
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 2 },
    { key: 'svt', label: 'SVT', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
  B: [
    { key: 'philosophie', label: 'Philosophie', coefficient: 3 },
    { key: 'langue_vivante_1', label: 'Langue vivante 1', coefficient: 2 },
    { key: 'mathematiques', label: 'Mathématiques', coefficient: 2 },
    { key: 'svt', label: 'SVT', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
  C: [
    { key: 'francais', label: 'Français', coefficient: 2 },
    { key: 'anglais', label: 'Anglais', coefficient: 2 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 2 },
    { key: 'philosophie', label: 'Philosophie', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
  D: [
    { key: 'francais', label: 'Français', coefficient: 2 },
    { key: 'anglais', label: 'Anglais', coefficient: 2 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 2 },
    { key: 'philosophie', label: 'Philosophie', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
  E: [
    { key: 'francais', label: 'Français', coefficient: 2 },
    { key: 'manipulation', label: 'Manipulation / travaux pratiques', coefficient: 3 },
    { key: 'etude_fabrication', label: 'Étude de fabrication ou technologie', coefficient: 2 },
    { key: 'eps', label: 'EPS', coefficient: 1 },
  ],
};

export function getRankingSubjects(series: BacSeries | null | undefined): RankingSubject[] {
  return series ? rankingSubjectsBySeries[series] || [] : [];
}

export function getAllSubjects(series: BacSeries | null | undefined): RankingSubject[] {
  if (!series) return [];
  return [...getRankingSubjects(series), ...(additionalSubjectsBySeries[series] || [])];
}

export function calculateRankingAverage(series: BacSeries | null | undefined, scores: AcademicSubjectScores): number | null {
  const subjects = getRankingSubjects(series);
  if (subjects.length !== 3 || subjects.some((subject) => typeof scores[subject.key] !== 'number')) return null;
  const totalCoefficient = subjects.reduce((sum, subject) => sum + subject.coefficient, 0);
  const weightedTotal = subjects.reduce((sum, subject) => sum + scores[subject.key] * subject.coefficient, 0);
  return Math.round((weightedTotal / totalCoefficient) * 100) / 100;
}

export function isValidScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 20;
}

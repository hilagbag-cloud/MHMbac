import { BacSeries, AcademicSubjectScores } from '../types/orientation';

export type RankingSubject = { key: string; label: string; coefficient: number };

// Coefficients publiés par l’Office du Baccalauréat du Bénin.
// Le guide MESRS utilise ensuite trois matières principales adaptées à la filière.
export const rankingSubjectsBySeries: Partial<Record<BacSeries, RankingSubject[]>> = {
  A: [
    { key: 'francais', label: 'Français', coefficient: 5 },
    { key: 'philosophie', label: 'Philosophie', coefficient: 4 },
    { key: 'histoire_geographie', label: 'Histoire-Géographie', coefficient: 3 },
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

export function getRankingSubjects(series: BacSeries | null | undefined): RankingSubject[] {
  return series ? rankingSubjectsBySeries[series] || [] : [];
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

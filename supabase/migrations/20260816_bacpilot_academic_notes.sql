-- BacPilot — notes facultatives et moyenne de classement issue de la grille officielle.
-- La moyenne est distincte de la moyenne générale du diplôme et reste informative.

ALTER TABLE public.user_academic_signals
  ADD COLUMN IF NOT EXISTS notes_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ranking_subjects jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ranking_average numeric(5,2),
  ADD COLUMN IF NOT EXISTS calculation_version text NOT NULL DEFAULT 'mesrs_2026_2027_ranking_v1';

ALTER TABLE public.user_academic_signals
  DROP CONSTRAINT IF EXISTS user_academic_signals_ranking_average_check;

ALTER TABLE public.user_academic_signals
  ADD CONSTRAINT user_academic_signals_ranking_average_check
  CHECK (ranking_average IS NULL OR (ranking_average >= 0 AND ranking_average <= 20));

COMMENT ON COLUMN public.user_academic_signals.ranking_average IS
  'Moyenne de classement indicative, calculée avec les trois matières principales et coefficients du guide MESRS 2026-2027; distincte de la moyenne générale du Bac.';
COMMENT ON COLUMN public.user_academic_signals.ranking_subjects IS
  'Notes saisies par le candidat, au format JSON validé côté Edge Function.';

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_academic_signals TO authenticated;

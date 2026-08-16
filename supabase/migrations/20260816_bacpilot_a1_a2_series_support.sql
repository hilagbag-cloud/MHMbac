-- BacPilot — distinction A1/A2 pour les coefficients officiels et la matrice par filière.
-- Les anciens profils « A » sont préservés mais ne reçoivent aucune moyenne de classement
-- tant que l'élève n'a pas précisé A1 ou A2.

ALTER TABLE public.programme_ranking_rules
  DROP CONSTRAINT IF EXISTS programme_ranking_rules_series_check;

ALTER TABLE public.programme_ranking_rules
  ADD CONSTRAINT programme_ranking_rules_series_check
  CHECK (series IN ('A', 'A1', 'A2', 'B', 'C', 'D', 'E'));

-- Le Top 3 reste calculé exclusivement depuis les observations temps réel existantes.
-- A1/A2 sont ramenées à « A » uniquement pour cette compatibilité de lecture :
-- les moyennes par filière, elles, conservent la série exacte A1 ou A2.
CREATE OR REPLACE FUNCTION public.get_top_recommendations_for_profile(
  p_objective text DEFAULT 'bourse',
  p_series text DEFAULT NULL,
  p_mention text DEFAULT NULL,
  p_career_keywords text[] DEFAULT '{}'::text[],
  p_limit integer DEFAULT 3
)
RETURNS TABLE (
  programme_id bigint,
  university text,
  school text,
  programme text,
  score integer,
  confidence text,
  observed_at timestamptz,
  updated_at timestamptz,
  freshness_minutes integer,
  factors jsonb,
  caveats jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.get_top_recommendations(
    p_objective,
    CASE upper(trim(coalesce(p_series, '')))
      WHEN 'A1' THEN 'A'
      WHEN 'A2' THEN 'A'
      WHEN '' THEN NULL
      ELSE upper(trim(p_series))
    END,
    p_mention,
    p_career_keywords,
    p_limit
  );
$$;

REVOKE ALL ON FUNCTION public.get_top_recommendations_for_profile(text, text, text, text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_recommendations_for_profile(text, text, text, text[], integer) TO authenticated;

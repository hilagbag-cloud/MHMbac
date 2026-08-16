-- BacPilot — matrice officielle de moyenne de classement par filière et série.
-- Une règle ne peut être chargée que si les trois matières sont explicitement indiquées dans le Guide MESRS
-- et si leurs coefficients sont connus pour la série dans la grille vérifiée de l'Office du Baccalauréat.

CREATE TABLE IF NOT EXISTS public.programme_ranking_rules (
  rule_id text PRIMARY KEY,
  guide_record_id text NOT NULL REFERENCES public.guide_programmes(record_id) ON DELETE CASCADE,
  series text NOT NULL CHECK (series IN ('A', 'B', 'C', 'D', 'E')),
  subjects jsonb NOT NULL CHECK (jsonb_typeof(subjects) = 'array' AND jsonb_array_length(subjects) = 3),
  source_pdf_page smallint NOT NULL CHECK (source_pdf_page BETWEEN 1 AND 1000),
  source_excerpt text NOT NULL,
  verification_status text NOT NULL DEFAULT 'source_explicit' CHECK (verification_status IN ('source_explicit', 'verified', 'needs_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guide_record_id, series)
);

CREATE INDEX IF NOT EXISTS programme_ranking_rules_record_series_idx
  ON public.programme_ranking_rules(guide_record_id, series);

ALTER TABLE public.programme_ranking_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.programme_ranking_rules FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.lookup_programme_ranking_rules(
  p_record_ids text[],
  p_series text
)
RETURNS TABLE (
  guide_record_id text,
  series text,
  subjects jsonb,
  source_pdf_page smallint,
  verification_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rule.guide_record_id,
    rule.series,
    rule.subjects,
    rule.source_pdf_page,
    rule.verification_status
  FROM public.programme_ranking_rules AS rule
  WHERE rule.guide_record_id = ANY(coalesce(p_record_ids, '{}'::text[]))
    AND rule.series = upper(trim(coalesce(p_series, '')))
  ORDER BY rule.source_pdf_page, rule.guide_record_id;
$$;

REVOKE ALL ON FUNCTION public.lookup_programme_ranking_rules(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_programme_ranking_rules(text[], text) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.programme_ranking_rules TO service_role;

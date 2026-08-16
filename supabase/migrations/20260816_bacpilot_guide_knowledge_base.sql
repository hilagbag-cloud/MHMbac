-- BacPilot — base de connaissances officielle issue du Guide MESRS 2026-2027.
-- Usage : comparer les filières, les séries recommandées, les quotas documentés et les débouchés,
-- avec une citation de page. Les recommandations restent informatives et ne valent jamais admission.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.guide_sources (
  source_id text PRIMARY KEY,
  title text NOT NULL,
  publisher text NOT NULL,
  edition text NOT NULL,
  source_sha256 text NOT NULL,
  page_count integer NOT NULL CHECK (page_count > 0),
  ingested_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  attribution text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guide_programmes (
  record_id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES public.guide_sources(source_id) ON DELETE RESTRICT,
  source_pdf_page smallint NOT NULL CHECK (source_pdf_page BETWEEN 1 AND 1000),
  institution text NOT NULL DEFAULT '',
  establishment text NOT NULL DEFAULT '',
  programme text NOT NULL,
  programme_normalized text NOT NULL,
  scholarship_quota integer NULL CHECK (scholarship_quota >= 0),
  scholarship_quota_raw text NOT NULL DEFAULT '',
  aid_or_fpp_quota integer NULL CHECK (aid_or_fpp_quota >= 0),
  aid_or_fpp_quota_raw text NOT NULL DEFAULT '',
  entry_mode text NOT NULL DEFAULT '',
  recommended_baccalaureates text[] NOT NULL DEFAULT '{}'::text[],
  key_subjects text[] NOT NULL DEFAULT '{}'::text[],
  career_outcomes text[] NOT NULL DEFAULT '{}'::text[],
  source_excerpt text NOT NULL DEFAULT '',
  completeness text NOT NULL DEFAULT 'partial' CHECK (completeness IN ('complete', 'partial')),
  verification_status text NOT NULL DEFAULT 'extracted' CHECK (verification_status IN ('extracted', 'needs_source_check', 'verified')),
  search_document tsvector NOT NULL DEFAULT ''::tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, source_pdf_page, programme_normalized, establishment)
);

CREATE OR REPLACE FUNCTION public.refresh_guide_programme_search_document()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.programme, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.establishment, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.institution, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.recommended_baccalaureates, ' '))), 'B') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.key_subjects, ' '))), 'C') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.career_outcomes, ' '))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guide_programmes_search_document_trigger ON public.guide_programmes;
CREATE TRIGGER guide_programmes_search_document_trigger
BEFORE INSERT OR UPDATE OF programme, establishment, institution, recommended_baccalaureates, key_subjects, career_outcomes
ON public.guide_programmes
FOR EACH ROW
EXECUTE FUNCTION public.refresh_guide_programme_search_document();

CREATE INDEX IF NOT EXISTS guide_programmes_source_page_idx
  ON public.guide_programmes(source_id, source_pdf_page);
CREATE INDEX IF NOT EXISTS guide_programmes_normalized_idx
  ON public.guide_programmes(programme_normalized);
CREATE INDEX IF NOT EXISTS guide_programmes_search_idx
  ON public.guide_programmes USING gin(search_document);

ALTER TABLE public.guide_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_programmes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.guide_sources FROM anon, authenticated;
REVOKE ALL ON TABLE public.guide_programmes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_guide_programmes(
  p_query text DEFAULT '',
  p_series text DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  record_id text,
  source_pdf_page smallint,
  institution text,
  establishment text,
  programme text,
  scholarship_quota integer,
  aid_or_fpp_quota integer,
  entry_mode text,
  recommended_baccalaureates text[],
  key_subjects text[],
  career_outcomes text[],
  source_excerpt text,
  completeness text,
  verification_status text,
  relevance real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH input AS (
    SELECT NULLIF(trim(unaccent(coalesce(p_query, ''))), '') AS query_text,
           NULLIF(trim(upper(coalesce(p_series, ''))), '') AS series_text,
           GREATEST(1, LEAST(coalesce(p_limit, 8), 20)) AS max_rows
  ), matches AS (
    SELECT
      gp.*,
      CASE
        WHEN i.query_text IS NULL THEN 0::real
        ELSE ts_rank_cd(gp.search_document, websearch_to_tsquery('french', i.query_text))
      END AS rank_score,
      CASE
        WHEN i.series_text IS NULL OR i.series_text = ANY(gp.recommended_baccalaureates) THEN 0.15::real
        ELSE 0::real
      END AS series_bonus
    FROM public.guide_programmes gp
    CROSS JOIN input i
    JOIN public.guide_sources gs ON gs.source_id = gp.source_id AND gs.active
    WHERE i.query_text IS NULL
       OR gp.search_document @@ websearch_to_tsquery('french', i.query_text)
       OR gp.programme_normalized = regexp_replace(lower(unaccent(i.query_text)), '[^a-z0-9]+', '-', 'g')
  )
  SELECT
    record_id, source_pdf_page, institution, establishment, programme,
    scholarship_quota, aid_or_fpp_quota, entry_mode,
    recommended_baccalaureates, key_subjects, career_outcomes,
    source_excerpt, completeness, verification_status,
    (rank_score + series_bonus)::real AS relevance
  FROM matches
  ORDER BY relevance DESC, programme ASC
  LIMIT (SELECT max_rows FROM input);
$$;

CREATE OR REPLACE FUNCTION public.lookup_guide_programmes(
  p_programmes text[],
  p_series text DEFAULT NULL
)
RETURNS TABLE (
  record_id text,
  source_pdf_page smallint,
  institution text,
  establishment text,
  programme text,
  scholarship_quota integer,
  aid_or_fpp_quota integer,
  entry_mode text,
  recommended_baccalaureates text[],
  key_subjects text[],
  career_outcomes text[],
  source_excerpt text,
  completeness text,
  verification_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    gp.record_id, gp.source_pdf_page, gp.institution, gp.establishment, gp.programme,
    gp.scholarship_quota, gp.aid_or_fpp_quota, gp.entry_mode,
    gp.recommended_baccalaureates, gp.key_subjects, gp.career_outcomes,
    gp.source_excerpt, gp.completeness, gp.verification_status
  FROM public.guide_programmes gp
  JOIN public.guide_sources gs ON gs.source_id = gp.source_id AND gs.active
  WHERE gp.programme_normalized = ANY (
    ARRAY(
      SELECT regexp_replace(lower(unaccent(coalesce(item, ''))), '[^a-z0-9]+', '-', 'g')
      FROM unnest(coalesce(p_programmes, '{}'::text[])) AS item
    )
  )
    AND (p_series IS NULL OR upper(trim(p_series)) = ANY(gp.recommended_baccalaureates) OR cardinality(gp.recommended_baccalaureates) = 0)
  ORDER BY gp.programme, gp.source_pdf_page;
$$;

REVOKE ALL ON FUNCTION public.search_guide_programmes(text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_guide_programmes(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_guide_programmes(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_guide_programmes(text[], text) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guide_sources TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guide_programmes TO service_role;

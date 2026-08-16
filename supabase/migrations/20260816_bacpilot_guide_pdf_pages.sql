-- BacPilot — corpus page par page du PDF MESRS 2026-2027.
-- Le texte complet est conservé une seule fois puis servi par extraits sourcés.

CREATE TABLE IF NOT EXISTS public.guide_pages (
  source_id text NOT NULL REFERENCES public.guide_sources(source_id) ON DELETE CASCADE,
  source_pdf_page smallint NOT NULL CHECK (source_pdf_page BETWEEN 1 AND 1000),
  section text NOT NULL DEFAULT '',
  has_programme_table boolean NOT NULL DEFAULT false,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, source_pdf_page),
  CHECK (char_length(content) > 0)
);

CREATE INDEX IF NOT EXISTS guide_pages_source_page_idx
  ON public.guide_pages(source_id, source_pdf_page);

ALTER TABLE public.guide_pages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.guide_pages FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guide_pages TO service_role;

CREATE OR REPLACE FUNCTION public.lookup_guide_pages(
  p_pages smallint[] DEFAULT '{}',
  p_query text DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  source_id text,
  source_pdf_page smallint,
  section text,
  has_programme_table boolean,
  content text,
  source_sha256 text,
  source_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gp.source_id,
    gp.source_pdf_page,
    gp.section,
    gp.has_programme_table,
    left(gp.content, 4800) AS content,
    gs.source_sha256,
    gs.title AS source_title
  FROM public.guide_pages gp
  JOIN public.guide_sources gs
    ON gs.source_id = gp.source_id
   AND gs.active
  WHERE (cardinality(coalesce(p_pages, '{}'::smallint[])) = 0 OR gp.source_pdf_page = ANY(p_pages))
    AND (nullif(trim(p_query), '') IS NULL OR gp.content ILIKE '%' || left(trim(p_query), 120) || '%')
  ORDER BY gp.source_pdf_page
  LIMIT greatest(1, least(coalesce(p_limit, 8), 12));
$$;

REVOKE ALL ON FUNCTION public.lookup_guide_pages(smallint[], text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_guide_pages(smallint[], text, integer) TO authenticated;

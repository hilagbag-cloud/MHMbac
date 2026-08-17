-- BacPilot — exposition contrôlée de la localité officielle quand elle est renseignée dans le guide.

CREATE OR REPLACE FUNCTION public.lookup_guide_programmes_enriched(
  p_programmes text[],
  p_series text DEFAULT NULL
)
RETURNS TABLE (
  record_id text,
  source_pdf_page smallint,
  institution text,
  establishment text,
  locality text,
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
    gp.record_id, gp.source_pdf_page, gp.institution, gp.establishment, gp.locality, gp.programme,
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

REVOKE ALL ON FUNCTION public.lookup_guide_programmes_enriched(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_guide_programmes_enriched(text[], text) TO authenticated;

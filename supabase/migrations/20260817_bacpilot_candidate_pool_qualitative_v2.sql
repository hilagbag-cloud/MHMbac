-- BacPilot — pool qualitatif diversifié pour la décision IA.
-- Cette fonction ne constitue pas un classement à afficher. Elle prépare uniquement
-- un ensemble borné de filières réellement observées, assorties de faits officiels.

CREATE OR REPLACE FUNCTION public.get_personalized_candidate_pool(
  p_objective text DEFAULT 'bourse',
  p_series text DEFAULT NULL,
  p_mention text DEFAULT NULL,
  p_career_keywords text[] DEFAULT '{}'::text[],
  p_strengths text[] DEFAULT '{}'::text[],
  p_subjects jsonb DEFAULT '{}'::jsonb,
  p_ranking_average numeric DEFAULT NULL,
  p_limit integer DEFAULT 18
)
RETURNS TABLE (
  programme_id bigint,
  university text,
  school text,
  programme text,
  confidence text,
  observed_at timestamptz,
  updated_at timestamptz,
  freshness_minutes integer,
  factors jsonb,
  caveats jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_objective NOT IN ('bourse', 'carriere', 'equilibre') THEN
    RAISE EXCEPTION 'Objective not allowed';
  END IF;
  IF p_series IS NOT NULL AND upper(trim(p_series)) NOT IN ('A', 'A1', 'A2', 'B', 'C', 'D', 'E', 'Autre') THEN
    RAISE EXCEPTION 'Series not allowed';
  END IF;
  IF p_mention IS NOT NULL AND p_mention NOT IN ('Passable', 'Assez bien', 'Bien', 'Très bien') THEN
    RAISE EXCEPTION 'Mention not allowed';
  END IF;
  IF p_limit < 6 OR p_limit > 24 THEN
    RAISE EXCEPTION 'Limit must be between 6 and 24';
  END IF;
  IF p_ranking_average IS NOT NULL AND (p_ranking_average < 0 OR p_ranking_average > 20) THEN
    RAISE EXCEPTION 'Ranking average not allowed';
  END IF;

  RETURN QUERY
  WITH input AS (
    SELECT
      lower(trim(coalesce(p_objective, 'bourse'))) AS objective,
      upper(trim(coalesce(p_series, ''))) AS series,
      trim(coalesce(p_mention, '')) AS mention,
      coalesce((SELECT array_agg(DISTINCT lower(left(trim(raw), 60))) FROM unnest(coalesce(p_career_keywords, '{}'::text[])) raw WHERE char_length(trim(raw)) BETWEEN 2 AND 60 LIMIT 8), '{}'::text[]) AS career_keywords,
      coalesce((SELECT array_agg(DISTINCT lower(left(trim(raw), 60))) FROM unnest(coalesce(p_strengths, '{}'::text[])) raw WHERE char_length(trim(raw)) BETWEEN 2 AND 60 LIMIT 8), '{}'::text[]) AS strengths,
      CASE WHEN jsonb_typeof(coalesce(p_subjects, '{}'::jsonb)) = 'object' THEN coalesce(p_subjects, '{}'::jsonb) ELSE '{}'::jsonb END AS subjects,
      p_ranking_average AS ranking_average
  ), base AS (
    SELECT
      lp.programme_id,
      lp.university,
      lp.school,
      lp.programme,
      lp.scholarships,
      lp.total,
      lp.passable,
      lp.ab,
      lp.b,
      lp.tb,
      lp.observed_at,
      lp.updated_at,
      i.objective,
      i.series,
      i.mention,
      i.career_keywords,
      i.strengths,
      CASE i.mention
        WHEN 'Passable' THEN lp.passable
        WHEN 'Assez bien' THEN lp.ab
        WHEN 'Bien' THEN lp.b
        WHEN 'Très bien' THEN lp.tb
        ELSE 0
      END AS selected_mention_count
    FROM public.live_programmes lp
    CROSS JOIN input i
  ), guide_context AS (
    SELECT
      b.programme_id,
      bool_or(
        b.series = ANY(gp.recommended_baccalaureates)
        OR (b.series IN ('A1', 'A2') AND 'A' = ANY(gp.recommended_baccalaureates))
      ) FILTER (WHERE gp.record_id IS NOT NULL) AS series_confirmed,
      bool_or(gp.record_id IS NOT NULL) AS has_guide,
      bool_or(
        EXISTS (
          SELECT 1
          FROM unnest(b.career_keywords) keyword
          WHERE lower(concat_ws(' ', b.programme, b.school, b.university, coalesce(gp.programme, ''), coalesce(gp.establishment, ''), array_to_string(coalesce(gp.career_outcomes, '{}'::text[]), ' '))) LIKE '%' || keyword || '%'
        )
      ) AS domain_match,
      bool_or(
        EXISTS (
          SELECT 1
          FROM unnest(b.strengths) strength
          WHERE lower(concat_ws(' ', b.programme, b.school, b.university, coalesce(gp.programme, ''), coalesce(gp.key_subjects, '{}'::text[]), array_to_string(coalesce(gp.career_outcomes, '{}'::text[]), ' '))) LIKE '%' || strength || '%'
        )
      ) AS strength_match
    FROM base b
    LEFT JOIN public.guide_programmes gp
      ON gp.programme_normalized = regexp_replace(lower(unaccent(b.programme)), '[^a-z0-9]+', '-', 'g')
    GROUP BY b.programme_id
  ), enriched AS (
    SELECT
      b.*,
      coalesce(g.series_confirmed, false) AS series_confirmed,
      coalesce(g.has_guide, false) AS has_guide,
      coalesce(g.domain_match, false) AS domain_match,
      coalesce(g.strength_match, false) AS strength_match,
      greatest(0, floor(extract(epoch FROM (clock_timestamp() - coalesce(b.observed_at, b.updated_at))) / 60)::integer) AS minutes_old
    FROM base b
    LEFT JOIN guide_context g ON g.programme_id = b.programme_id
    WHERE b.series = '' OR coalesce(g.series_confirmed, false) OR NOT coalesce(g.has_guide, false)
  ), ranked AS (
    SELECT
      e.*,
      row_number() OVER (ORDER BY e.domain_match DESC, e.strength_match DESC, e.series_confirmed DESC, e.observed_at DESC NULLS LAST, e.programme_id) AS domain_rank,
      row_number() OVER (ORDER BY e.series_confirmed DESC, e.has_guide DESC, e.observed_at DESC NULLS LAST, e.programme_id) AS series_rank,
      row_number() OVER (ORDER BY e.scholarships DESC, e.selected_mention_count ASC, e.total ASC, e.observed_at DESC NULLS LAST, e.programme_id) AS scholarship_rank,
      row_number() OVER (ORDER BY e.total ASC, e.selected_mention_count ASC, e.observed_at DESC NULLS LAST, e.programme_id) AS pressure_rank
    FROM enriched e
  ), bucketed AS (
    SELECT r.*, 'cohérence avec le domaine déclaré'::text AS selection_reason, 1 AS bucket_priority
    FROM ranked r
    WHERE cardinality(r.career_keywords) > 0 AND r.domain_match AND r.domain_rank <= 8
    UNION ALL
    SELECT r.*, 'compatibilité de série vérifiée dans le guide'::text AS selection_reason, 2 AS bucket_priority
    FROM ranked r
    WHERE r.series_rank <= 8
    UNION ALL
    SELECT r.*, 'quota observé à comparer pour l’objectif bourse'::text AS selection_reason, CASE WHEN r.objective = 'bourse' THEN 1 ELSE 3 END AS bucket_priority
    FROM ranked r
    WHERE r.scholarship_rank <= 8
    UNION ALL
    SELECT r.*, 'pression observée à comparer'::text AS selection_reason, CASE WHEN r.objective = 'bourse' THEN 2 ELSE 4 END AS bucket_priority
    FROM ranked r
    WHERE r.pressure_rank <= 8
  ), deduplicated AS (
    SELECT
      bucketed.programme_id,
      min(bucketed.bucket_priority) AS bucket_priority,
      array_agg(DISTINCT bucketed.selection_reason ORDER BY bucketed.selection_reason) AS selection_reasons
    FROM bucketed
    GROUP BY bucketed.programme_id
  )
  SELECT
    r.programme_id,
    r.university,
    r.school,
    r.programme,
    CASE WHEN r.minutes_old <= 15 AND r.has_guide THEN 'high' WHEN r.minutes_old <= 60 THEN 'medium' ELSE 'low' END AS confidence,
    r.observed_at,
    r.updated_at,
    r.minutes_old AS freshness_minutes,
    jsonb_build_object(
      'objective', r.objective,
      'series_provided', nullif(r.series, ''),
      'mention_provided', nullif(r.mention, ''),
      'scholarships_observed', r.scholarships,
      'applicants_observed', r.total,
      'selected_mention_observed', r.selected_mention_count,
      'guide_series_confirmed', r.series_confirmed,
      'guide_available', r.has_guide,
      'domain_match_observed', r.domain_match,
      'strength_match_observed', r.strength_match,
      'career_keywords_used', r.career_keywords,
      'strengths_used', r.strengths,
      'selection_reasons', d.selection_reasons
    ) AS factors,
    to_jsonb(array_remove(ARRAY[
      'Pool de comparaison issu des observations collectées et du guide disponible.',
      'La décision finale doit être vérifiée sur le portail officiel.',
      CASE WHEN r.has_guide THEN NULL ELSE 'Aucune fiche guide exactement rattachée : vérification manuelle renforcée.' END,
      CASE WHEN r.series <> '' AND NOT r.series_confirmed AND r.has_guide THEN 'Le guide ne confirme pas explicitement cette série : ne pas retenir sans vérification.' END
    ]::text[], NULL)) AS caveats
  FROM ranked r
  JOIN deduplicated d ON d.programme_id = r.programme_id
  ORDER BY d.bucket_priority, r.domain_match DESC, r.series_confirmed DESC, r.observed_at DESC NULLS LAST, r.programme_id
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_personalized_candidate_pool(text, text, text, text[], text[], jsonb, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_personalized_candidate_pool(text, text, text, text[], text[], jsonb, numeric, integer) TO authenticated;

COMMENT ON FUNCTION public.get_personalized_candidate_pool(text, text, text, text[], text[], jsonb, numeric, integer)
IS 'Builds a bounded, diverse, factual candidate pool for BacPilot AI. It never exposes a public numerical score.';

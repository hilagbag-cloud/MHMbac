-- BacPilot — affinage des scores d'orientation
-- Les signaux de base sont plafonnés avant pondération afin de conserver
-- un classement discriminant lorsque les bourses observées dépassent les inscrits.

CREATE OR REPLACE FUNCTION public.get_top_recommendations(
  p_objective TEXT DEFAULT 'bourse',
  p_series TEXT DEFAULT NULL,
  p_mention TEXT DEFAULT NULL,
  p_career_keywords TEXT[] DEFAULT '{}'::text[],
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  programme_id BIGINT,
  university TEXT,
  school TEXT,
  programme TEXT,
  score INTEGER,
  confidence TEXT,
  observed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  freshness_minutes INTEGER,
  factors JSONB,
  caveats JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_objective NOT IN ('bourse', 'carriere', 'equilibre') THEN
    RAISE EXCEPTION 'Objective not allowed';
  END IF;
  IF p_series IS NOT NULL AND p_series NOT IN ('A', 'B', 'C', 'D', 'E', 'Autre') THEN
    RAISE EXCEPTION 'Series not allowed';
  END IF;
  IF p_mention IS NOT NULL AND p_mention NOT IN ('Passable', 'Assez bien', 'Bien', 'Très bien') THEN
    RAISE EXCEPTION 'Mention not allowed';
  END IF;
  IF p_limit < 1 OR p_limit > 3 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 3';
  END IF;

  RETURN QUERY
  WITH normalized_keywords AS (
    SELECT array_agg(keyword) AS values
    FROM (
      SELECT DISTINCT lower(left(trim(raw_keyword), 60)) AS keyword
      FROM unnest(coalesce(p_career_keywords, '{}'::text[])) AS raw_keyword
      WHERE char_length(trim(raw_keyword)) BETWEEN 2 AND 60
      LIMIT 8
    ) clean_keywords
  ), base AS (
    SELECT
      lp.*,
      CASE p_mention
        WHEN 'Passable' THEN lp.passable
        WHEN 'Assez bien' THEN lp.ab
        WHEN 'Bien' THEN lp.b
        WHEN 'Très bien' THEN lp.tb
        ELSE 0
      END AS selected_mention_count,
      coalesce((SELECT values FROM normalized_keywords), '{}'::text[]) AS keywords
    FROM public.live_programmes lp
  ), maxima AS (
    SELECT
      greatest(max(total), 1) AS max_total,
      greatest(max(selected_mention_count), 1) AS max_selected_mention_count
    FROM base
  ), signals AS (
    SELECT
      b.*,
      least(100, greatest(0, round(100.0 * b.scholarships / greatest(b.total, 1))::integer)) AS scholarship_signal,
      least(100, greatest(0, round(100.0 * (1 - b.total::numeric / m.max_total))::integer)) AS general_pressure_signal,
      least(100, greatest(0, round(100.0 * (1 - b.selected_mention_count::numeric / m.max_selected_mention_count))::integer)) AS mention_pressure_signal,
      CASE
        WHEN cardinality(b.keywords) = 0 THEN 0
        WHEN EXISTS (
          SELECT 1
          FROM unnest(b.keywords) AS keyword
          WHERE lower(concat_ws(' ', b.programme, b.school, b.university)) LIKE '%' || keyword || '%'
        ) THEN 100
        ELSE 0
      END AS career_match_signal,
      greatest(0, floor(extract(epoch FROM (clock_timestamp() - coalesce(b.observed_at, b.updated_at))) / 60)::integer) AS minutes_old
    FROM base b
    CROSS JOIN maxima m
  ), scored AS (
    SELECT
      s.*,
      least(100, greatest(0, round(
        CASE p_objective
          WHEN 'bourse' THEN (0.65 * s.scholarship_signal) + (0.20 * s.general_pressure_signal) + (0.15 * s.mention_pressure_signal)
          WHEN 'carriere' THEN (0.55 * s.career_match_signal) + (0.25 * s.general_pressure_signal) + (0.20 * s.mention_pressure_signal)
          ELSE (0.35 * s.scholarship_signal) + (0.35 * s.career_match_signal) + (0.15 * s.general_pressure_signal) + (0.15 * s.mention_pressure_signal)
        END
      )))::integer AS calculated_score
    FROM signals s
  )
  SELECT
    s.programme_id,
    s.university,
    s.school,
    s.programme,
    s.calculated_score,
    CASE
      WHEN s.minutes_old <= 15 THEN 'high'
      WHEN s.minutes_old <= 60 THEN 'medium'
      ELSE 'low'
    END AS confidence,
    s.observed_at,
    s.updated_at,
    s.minutes_old,
    jsonb_build_object(
      'objective', p_objective,
      'scholarships_observed', s.scholarships,
      'applicants_observed', s.total,
      'selected_mention_observed', s.selected_mention_count,
      'scholarship_signal', s.scholarship_signal,
      'general_pressure_signal', s.general_pressure_signal,
      'mention_pressure_signal', s.mention_pressure_signal,
      'career_match_signal', s.career_match_signal,
      'series_provided', p_series,
      'mention_provided', p_mention,
      'career_keywords_used', s.keywords
    ),
    to_jsonb(array_remove(ARRAY[
      'Classement indicatif fondé sur les observations collectées, non sur une décision officielle.',
      'L’éligibilité à la filière et la validation du choix doivent être contrôlées sur le portail officiel.',
      CASE WHEN cardinality(s.keywords) = 0 THEN 'Aucun mot-clé métier fourni : le signal carrière n’a pas été utilisé.' ELSE NULL END,
      CASE WHEN p_series IS NOT NULL THEN 'La série est mémorisée, mais aucune règle officielle d’éligibilité par série n’est encore intégrée au catalogue.' ELSE NULL END
    ]::text[], NULL))
  FROM scored s
  ORDER BY s.calculated_score DESC, s.observed_at DESC NULLS LAST, s.programme_id
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_recommendations(TEXT, TEXT, TEXT, TEXT[], INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_recommendations(TEXT, TEXT, TEXT, TEXT[], INTEGER) TO authenticated;

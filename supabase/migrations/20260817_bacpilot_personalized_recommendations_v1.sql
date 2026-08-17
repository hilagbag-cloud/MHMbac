-- BacPilot personalized ranking v1
-- The legacy RPC remains untouched for rollback. The assistant switches to this
-- function only after this function has been applied and tested.

CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_objective text DEFAULT 'bourse',
  p_series text DEFAULT NULL,
  p_mention text DEFAULT NULL,
  p_career_keywords text[] DEFAULT '{}'::text[],
  p_strengths text[] DEFAULT '{}'::text[],
  p_subjects jsonb DEFAULT '{}'::jsonb,
  p_ranking_average numeric DEFAULT NULL,
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
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
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
  IF p_limit < 1 OR p_limit > 3 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 3';
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
      coalesce(p_career_keywords, '{}'::text[]) AS career_keywords,
      coalesce(p_strengths, '{}'::text[]) AS strengths,
      CASE WHEN jsonb_typeof(coalesce(p_subjects, '{}'::jsonb)) = 'object' THEN coalesce(p_subjects, '{}'::jsonb) ELSE '{}'::jsonb END AS subjects,
      p_ranking_average AS ranking_average
  ), normalized_input AS (
    SELECT
      i.*,
      coalesce((SELECT array_agg(DISTINCT lower(left(trim(raw), 60))) FROM unnest(i.career_keywords) raw WHERE char_length(trim(raw)) BETWEEN 2 AND 60 LIMIT 8), '{}'::text[]) AS normalized_career_keywords,
      coalesce((SELECT array_agg(DISTINCT lower(left(trim(raw), 60))) FROM unnest(i.strengths) raw WHERE char_length(trim(raw)) BETWEEN 2 AND 60 LIMIT 8), '{}'::text[]) AS normalized_strengths
    FROM input i
  ), base AS (
    SELECT
      lp.*,
      i.objective,
      i.series,
      i.mention,
      i.subjects,
      i.ranking_average,
      i.normalized_career_keywords,
      i.normalized_strengths,
      CASE i.mention
        WHEN 'Passable' THEN lp.passable
        WHEN 'Assez bien' THEN lp.ab
        WHEN 'Bien' THEN lp.b
        WHEN 'Très bien' THEN lp.tb
        ELSE 0
      END AS selected_mention_count
    FROM public.live_programmes lp
    CROSS JOIN normalized_input i
  ), guide_matches AS (
    SELECT
      b.programme_id,
      count(gp.record_id)::integer AS guide_match_count,
      max(CASE
        WHEN gp.record_id IS NULL THEN 50
        WHEN b.series = ANY(gp.recommended_baccalaureates)
          OR (b.series IN ('A1', 'A2') AND 'A' = ANY(gp.recommended_baccalaureates)) THEN 100
        ELSE 0
      END)::integer AS series_fit_signal,
      max(CASE
        WHEN gp.record_id IS NULL THEN NULL
        WHEN EXISTS (
          SELECT 1
          FROM jsonb_each_text(b.subjects) AS subject_entry(subject_key, subject_value)
          WHERE subject_entry.subject_value ~ '^[0-9]+(\\.[0-9]+)?$'
            AND EXISTS (
              SELECT 1
              FROM unnest(coalesce(gp.key_subjects, '{}'::text[])) AS guide_subject(label)
              WHERE regexp_replace(lower(unaccent(guide_subject.label)), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(unaccent(subject_entry.subject_key)), '[^a-z0-9]+', '', 'g')
            )
        ) THEN (
          SELECT round(avg((subject_entry.subject_value)::numeric * 5))::integer
          FROM jsonb_each_text(b.subjects) AS subject_entry(subject_key, subject_value)
          WHERE subject_entry.subject_value ~ '^[0-9]+(\\.[0-9]+)?$'
            AND EXISTS (
              SELECT 1
              FROM unnest(coalesce(gp.key_subjects, '{}'::text[])) AS guide_subject(label)
              WHERE regexp_replace(lower(unaccent(guide_subject.label)), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(unaccent(subject_entry.subject_key)), '[^a-z0-9]+', '', 'g')
            )
        )
        ELSE NULL
      END)::integer AS subject_fit_from_guide,
      max(CASE WHEN gp.record_id IS NULL THEN 0 ELSE 1 END)::integer AS guide_available,
      max(CASE
        WHEN cardinality(b.normalized_career_keywords) = 0 THEN 0
        WHEN EXISTS (
          SELECT 1
          FROM unnest(b.normalized_career_keywords) AS keyword
          WHERE lower(concat_ws(' ', b.programme, b.school, b.university, coalesce(gp.programme, ''), coalesce(gp.establishment, ''), array_to_string(coalesce(gp.career_outcomes, '{}'::text[]), ' '))) LIKE '%' || keyword || '%'
        ) THEN 100 ELSE 0 END
      )::integer AS career_match_signal,
      max(CASE
        WHEN cardinality(b.normalized_strengths) = 0 THEN 0
        WHEN EXISTS (
          SELECT 1
          FROM unnest(b.normalized_strengths) AS strength
          WHERE lower(concat_ws(' ', b.programme, b.school, b.university, coalesce(gp.programme, ''), coalesce(gp.key_subjects, '{}'::text[]), coalesce(gp.career_outcomes, '{}'::text[]))) LIKE '%' || strength || '%'
        ) THEN 100 ELSE 0 END
      )::integer AS strength_match_signal
    FROM base b
    LEFT JOIN public.guide_programmes gp
      ON gp.programme_normalized = regexp_replace(lower(unaccent(b.programme)), '[^a-z0-9]+', '-', 'g')
    GROUP BY b.programme_id
  ), maxima AS (
    SELECT
      greatest(max(total), 1) AS max_total,
      greatest(max(selected_mention_count), 1) AS max_selected_mention_count,
      greatest(max(scholarships), 1) AS max_scholarships
    FROM base
  ), signals AS (
    SELECT
      b.*,
      coalesce(g.series_fit_signal, 50) AS series_fit_signal,
      coalesce(g.subject_fit_from_guide, CASE WHEN b.ranking_average IS NULL THEN 0 ELSE round(b.ranking_average * 5)::integer END) AS subject_fit_signal,
      CASE WHEN b.ranking_average IS NULL THEN 0 ELSE round(b.ranking_average * 5)::integer END AS academic_average_signal,
      coalesce(g.career_match_signal, 0) AS career_match_signal,
      coalesce(g.strength_match_signal, 0) AS strength_match_signal,
      coalesce(g.guide_match_count, 0) AS guide_match_count,
      coalesce(g.guide_available, 0) AS guide_available,
      least(100, greatest(0, round(100.0 * b.scholarships / greatest(b.total, 1))::integer)) AS scholarship_rate_signal,
      least(100, greatest(0, round(100.0 * b.scholarships / m.max_scholarships)::integer)) AS scholarship_volume_signal,
      least(100, greatest(0, round((0.70 * least(100, 100.0 * b.scholarships / greatest(b.total, 1))) + (0.30 * least(100, 100.0 * b.scholarships / m.max_scholarships)))::integer)) AS scholarship_signal,
      least(100, greatest(0, round(100.0 * (1 - b.total::numeric / m.max_total))::integer)) AS general_pressure_signal,
      least(100, greatest(0, round(100.0 * (1 - b.selected_mention_count::numeric / m.max_selected_mention_count))::integer)) AS mention_pressure_signal,
      greatest(0, floor(extract(epoch FROM (clock_timestamp() - coalesce(b.observed_at, b.updated_at))) / 60)::integer) AS minutes_old
    FROM base b
    CROSS JOIN maxima m
    LEFT JOIN guide_matches g ON g.programme_id = b.programme_id
  ), scored AS (
    SELECT
      s.*,
      least(100, greatest(0, round(CASE s.objective
        WHEN 'bourse' THEN (0.30 * s.scholarship_signal) + (0.20 * s.series_fit_signal) + (0.15 * s.subject_fit_signal) + (0.10 * s.academic_average_signal) + (0.15 * s.general_pressure_signal) + (0.10 * s.mention_pressure_signal)
        WHEN 'carriere' THEN (0.25 * s.career_match_signal) + (0.20 * s.strength_match_signal) + (0.15 * s.series_fit_signal) + (0.15 * s.subject_fit_signal) + (0.10 * s.academic_average_signal) + (0.10 * s.general_pressure_signal) + (0.05 * s.mention_pressure_signal)
        ELSE (0.20 * s.scholarship_signal) + (0.20 * s.career_match_signal) + (0.10 * s.strength_match_signal) + (0.15 * s.series_fit_signal) + (0.15 * s.subject_fit_signal) + (0.10 * s.academic_average_signal) + (0.05 * s.general_pressure_signal) + (0.05 * s.mention_pressure_signal)
      END)))::integer AS calculated_score
    FROM signals s
  )
  SELECT
    s.programme_id,
    s.university,
    s.school,
    s.programme,
    s.calculated_score,
    CASE WHEN s.minutes_old <= 15 AND s.guide_available = 1 THEN 'high' WHEN s.minutes_old <= 60 THEN 'medium' ELSE 'low' END AS confidence,
    s.observed_at,
    s.updated_at,
    s.minutes_old,
    jsonb_build_object(
      'objective', s.objective,
      'series_provided', nullif(s.series, ''),
      'mention_provided', nullif(s.mention, ''),
      'scholarships_observed', s.scholarships,
      'applicants_observed', s.total,
      'selected_mention_observed', s.selected_mention_count,
      'scholarship_signal', s.scholarship_signal,
      'scholarship_rate_signal', s.scholarship_rate_signal,
      'scholarship_volume_signal', s.scholarship_volume_signal,
      'general_pressure_signal', s.general_pressure_signal,
      'mention_pressure_signal', s.mention_pressure_signal,
      'series_fit_signal', s.series_fit_signal,
      'subject_fit_signal', s.subject_fit_signal,
      'academic_average_signal', s.academic_average_signal,
      'career_match_signal', s.career_match_signal,
      'strength_match_signal', s.strength_match_signal,
      'guide_match_count', s.guide_match_count,
      'guide_series_eligible', s.series_fit_signal = 100,
      'career_keywords_used', s.normalized_career_keywords,
      'strengths_used', s.normalized_strengths,
      'ranking_average_provided', s.ranking_average
    ),
    to_jsonb(array_remove(ARRAY[
      'Classement indicatif fondé sur les observations collectées et les informations déclarées par le candidat.',
      'L’éligibilité et la validation finale doivent être contrôlées sur le portail officiel.',
      CASE WHEN nullif(s.series, '') IS NULL THEN 'Série absente : la compatibilité du guide est limitée.' ELSE NULL END,
      CASE WHEN s.ranking_average IS NULL THEN 'Moyenne de classement non fournie : le score académique n’a pas été utilisé.' ELSE NULL END,
      CASE WHEN cardinality(s.normalized_career_keywords) = 0 THEN 'Aucun domaine métier fourni : le signal carrière n’a pas été utilisé.' ELSE NULL END,
      CASE WHEN s.guide_available = 0 THEN 'Aucune fiche guide exactement rattachée à cette piste : vérification manuelle nécessaire.' ELSE NULL END
    ]::text[], NULL))
  FROM scored s
  ORDER BY s.calculated_score DESC, s.series_fit_signal DESC, s.subject_fit_signal DESC, s.career_match_signal DESC, s.observed_at DESC NULLS LAST, s.programme_id
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_personalized_recommendations(text, text, text, text[], text[], jsonb, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(text, text, text, text[], text[], jsonb, numeric, integer) TO authenticated;

-- BacPilot — fondations de l'assistant d'orientation
-- MHM SOLUTIONS · Créateur : Hilarus GBAGOULE
-- Les décisions restent déterministes. L'agent lit les observations et
-- n'écrit que les éléments associés au compte authentifié.

CREATE TABLE IF NOT EXISTS public.orientation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step SMALLINT NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 20),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(messages) = 'array'),
  profile_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS orientation_sessions_user_updated_idx
  ON public.orientation_sessions (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.user_academic_signals (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  strengths TEXT[] NOT NULL DEFAULT '{}'::text[],
  subjects JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(subjects) = 'object'),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.recommendation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective TEXT NOT NULL CHECK (objective IN ('bourse', 'carriere', 'equilibre')),
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(results) = 'array'),
  freshness_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS recommendation_runs_user_created_idx
  ON public.recommendation_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  successful_calls SMALLINT NOT NULL DEFAULT 0 CHECK (successful_calls >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, usage_date)
);

-- Prévu pour la future collecte exhaustive. Aucun client n'y a accès.
CREATE TABLE IF NOT EXISTS public.collection_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'chrome_extension',
  scan_started_at TIMESTAMPTZ,
  scan_completed_at TIMESTAMPTZ,
  discovered_items INTEGER NOT NULL DEFAULT 0 CHECK (discovered_items >= 0),
  accepted_items INTEGER NOT NULL DEFAULT 0 CHECK (accepted_items >= 0),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'partial', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.orientation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_academic_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_runs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orientation_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_academic_signals TO authenticated;
GRANT SELECT, INSERT ON public.recommendation_runs TO authenticated;

DROP POLICY IF EXISTS orientation_sessions_select_own ON public.orientation_sessions;
DROP POLICY IF EXISTS orientation_sessions_insert_own ON public.orientation_sessions;
DROP POLICY IF EXISTS orientation_sessions_update_own ON public.orientation_sessions;
DROP POLICY IF EXISTS orientation_sessions_delete_own ON public.orientation_sessions;
CREATE POLICY orientation_sessions_select_own ON public.orientation_sessions
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY orientation_sessions_insert_own ON public.orientation_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY orientation_sessions_update_own ON public.orientation_sessions
  FOR UPDATE TO authenticated USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY orientation_sessions_delete_own ON public.orientation_sessions
  FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS academic_signals_select_own ON public.user_academic_signals;
DROP POLICY IF EXISTS academic_signals_insert_own ON public.user_academic_signals;
DROP POLICY IF EXISTS academic_signals_update_own ON public.user_academic_signals;
DROP POLICY IF EXISTS academic_signals_delete_own ON public.user_academic_signals;
CREATE POLICY academic_signals_select_own ON public.user_academic_signals
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY academic_signals_insert_own ON public.user_academic_signals
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY academic_signals_update_own ON public.user_academic_signals
  FOR UPDATE TO authenticated USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY academic_signals_delete_own ON public.user_academic_signals
  FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS recommendation_runs_select_own ON public.recommendation_runs;
DROP POLICY IF EXISTS recommendation_runs_insert_own ON public.recommendation_runs;
CREATE POLICY recommendation_runs_select_own ON public.recommendation_runs
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY recommendation_runs_insert_own ON public.recommendation_runs
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- Aucun droit direct pour les candidats sur les quotas ou les métriques de collecte.
REVOKE ALL ON public.ai_usage_daily FROM anon, authenticated;
REVOKE ALL ON public.collection_runs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_orientation_agent_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orientation_sessions_touch_updated_at ON public.orientation_sessions;
CREATE TRIGGER orientation_sessions_touch_updated_at
BEFORE UPDATE ON public.orientation_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_orientation_agent_updated_at();

DROP TRIGGER IF EXISTS academic_signals_touch_updated_at ON public.user_academic_signals;
CREATE TRIGGER academic_signals_touch_updated_at
BEFORE UPDATE ON public.user_academic_signals
FOR EACH ROW EXECUTE FUNCTION public.touch_orientation_agent_updated_at();

CREATE OR REPLACE FUNCTION public.get_data_freshness()
RETURNS TABLE (
  total_programmes INTEGER,
  last_observed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  age_minutes INTEGER,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH snapshot AS (
    SELECT
      count(*)::integer AS programme_count,
      max(observed_at) AS latest_observed_at,
      max(updated_at) AS latest_updated_at
    FROM public.live_programmes
  ), calculated AS (
    SELECT
      programme_count,
      latest_observed_at,
      latest_updated_at,
      CASE
        WHEN coalesce(latest_observed_at, latest_updated_at) IS NULL THEN NULL
        ELSE greatest(0, floor(extract(epoch FROM (clock_timestamp() - coalesce(latest_observed_at, latest_updated_at))) / 60)::integer)
      END AS minutes_old
    FROM snapshot
  )
  SELECT
    programme_count,
    latest_observed_at,
    latest_updated_at,
    minutes_old,
    CASE
      WHEN programme_count = 0 THEN 'missing'
      WHEN minutes_old IS NULL THEN 'unknown'
      WHEN minutes_old <= 15 THEN 'fresh'
      WHEN minutes_old <= 60 THEN 'aging'
      ELSE 'stale'
    END
  FROM calculated;
$$;

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
      round(100.0 * b.scholarships / greatest(b.total, 1))::integer AS scholarship_signal,
      round(100.0 * (1 - b.total::numeric / m.max_total))::integer AS general_pressure_signal,
      round(100.0 * (1 - b.selected_mention_count::numeric / m.max_selected_mention_count))::integer AS mention_pressure_signal,
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

CREATE OR REPLACE FUNCTION public.get_ai_quota_status(p_daily_limit INTEGER DEFAULT 3)
RETURNS TABLE (used_calls INTEGER, remaining_calls INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_daily_limit < 1 OR p_daily_limit > 10 THEN
    RAISE EXCEPTION 'Daily limit out of range';
  END IF;

  SELECT successful_calls INTO calls_used
  FROM public.ai_usage_daily
  WHERE user_id = current_user_id AND usage_date = current_date;

  RETURN QUERY SELECT coalesce(calls_used, 0), greatest(p_daily_limit - coalesce(calls_used, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_daily_limit INTEGER DEFAULT 3)
RETURNS TABLE (allowed BOOLEAN, remaining_calls INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_daily_limit < 1 OR p_daily_limit > 10 THEN
    RAISE EXCEPTION 'Daily limit out of range';
  END IF;

  INSERT INTO public.ai_usage_daily (user_id, usage_date, successful_calls)
  VALUES (current_user_id, current_date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET successful_calls = public.ai_usage_daily.successful_calls + 1,
        updated_at = timezone('utc', now())
    WHERE public.ai_usage_daily.successful_calls < p_daily_limit
  RETURNING successful_calls INTO calls_used;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, greatest(p_daily_limit - calls_used, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_data_freshness() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_top_recommendations(TEXT, TEXT, TEXT, TEXT[], INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_ai_quota_status(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_data_freshness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_recommendations(TEXT, TEXT, TEXT, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_quota_status(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(INTEGER) TO authenticated;

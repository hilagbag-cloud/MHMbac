-- BacPilot — durcissement des droits de l'agent
-- Les quotas appartiennent au candidat courant, sont plafonnés en base et
-- les fonctions de déclencheur ne sont pas exposées en RPC.

CREATE OR REPLACE FUNCTION public.touch_orientation_agent_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_orientation_agent_updated_at() FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.ai_usage_daily TO authenticated;

DROP POLICY IF EXISTS ai_usage_daily_select_own ON public.ai_usage_daily;
DROP POLICY IF EXISTS ai_usage_daily_insert_own ON public.ai_usage_daily;
DROP POLICY IF EXISTS ai_usage_daily_update_own ON public.ai_usage_daily;
CREATE POLICY ai_usage_daily_select_own ON public.ai_usage_daily
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY ai_usage_daily_insert_own ON public.ai_usage_daily
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id
    AND usage_date = current_date
    AND successful_calls BETWEEN 0 AND 3
  );
CREATE POLICY ai_usage_daily_update_own ON public.ai_usage_daily
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (
    auth.uid()::text = user_id
    AND usage_date = current_date
    AND successful_calls BETWEEN 0 AND 3
  );

CREATE OR REPLACE FUNCTION public.prevent_ai_quota_reset()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id
     OR NEW.usage_date <> OLD.usage_date
     OR NEW.successful_calls <> OLD.successful_calls + 1 THEN
    RAISE EXCEPTION 'AI quota can only increase by one';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_usage_daily_prevent_reset ON public.ai_usage_daily;
CREATE TRIGGER ai_usage_daily_prevent_reset
BEFORE UPDATE ON public.ai_usage_daily
FOR EACH ROW EXECUTE FUNCTION public.prevent_ai_quota_reset();

REVOKE ALL ON FUNCTION public.prevent_ai_quota_reset() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_ai_quota_status(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_ai_quota(INTEGER) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_ai_quota_status(INTEGER);
DROP FUNCTION IF EXISTS public.consume_ai_quota(INTEGER);

CREATE OR REPLACE FUNCTION public.get_ai_quota_status()
RETURNS TABLE (used_calls INTEGER, remaining_calls INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT successful_calls INTO calls_used
  FROM public.ai_usage_daily
  WHERE user_id = current_user_id AND usage_date = current_date;

  RETURN QUERY SELECT coalesce(calls_used, 0), greatest(3 - coalesce(calls_used, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_quota()
RETURNS TABLE (allowed BOOLEAN, remaining_calls INTEGER)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.ai_usage_daily (user_id, usage_date, successful_calls)
  VALUES (current_user_id, current_date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET successful_calls = public.ai_usage_daily.successful_calls + 1,
        updated_at = timezone('utc', now())
    WHERE public.ai_usage_daily.successful_calls < 3
  RETURNING successful_calls INTO calls_used;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, greatest(3 - calls_used, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_quota_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;

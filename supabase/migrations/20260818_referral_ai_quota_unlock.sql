-- BacPilot — quota IA quotidien et déblocage transparent par parrainage réel
-- Règle : 3 utilisations de base par jour + 1 bonus par inscription attribuée,
-- plafonné à 3 bonus (maximum 6 utilisations quotidiennes).
-- Les bonus sont calculés exclusivement à partir de public.user_referrals.

DROP FUNCTION IF EXISTS public.get_ai_quota_status();
CREATE FUNCTION public.get_ai_quota_status()
RETURNS TABLE (
  used_calls INTEGER,
  base_daily_limit INTEGER,
  referral_bonus_calls INTEGER,
  daily_limit INTEGER,
  remaining_calls INTEGER,
  confirmed_referrals INTEGER,
  referral_bonus_cap INTEGER,
  referrals_until_next_bonus INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER := 0;
  referral_count INTEGER := 0;
  base_limit CONSTANT INTEGER := 3;
  bonus_cap CONSTANT INTEGER := 3;
  bonus_calls INTEGER := 0;
  effective_limit INTEGER := 0;
BEGIN
  IF current_user_id IS NULL OR current_user_id = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT successful_calls INTO calls_used
  FROM public.ai_usage_daily
  WHERE user_id = current_user_id
    AND usage_date = current_date;

  SELECT count(*)::INTEGER INTO referral_count
  FROM public.user_referrals
  WHERE referrer_user_id = current_user_id;

  bonus_calls := least(coalesce(referral_count, 0), bonus_cap);
  effective_limit := base_limit + bonus_calls;

  RETURN QUERY SELECT
    coalesce(calls_used, 0),
    base_limit,
    bonus_calls,
    effective_limit,
    greatest(effective_limit - coalesce(calls_used, 0), 0),
    coalesce(referral_count, 0),
    bonus_cap,
    greatest(1 - coalesce(referral_count, 0), 0);
END;
$$;

DROP FUNCTION IF EXISTS public.consume_ai_quota();
CREATE FUNCTION public.consume_ai_quota()
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_calls INTEGER,
  daily_limit INTEGER,
  used_calls INTEGER,
  referral_bonus_calls INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT := auth.uid()::text;
  calls_used INTEGER;
  referral_count INTEGER := 0;
  base_limit CONSTANT INTEGER := 3;
  bonus_cap CONSTANT INTEGER := 3;
  bonus_calls INTEGER := 0;
  effective_limit INTEGER := 0;
BEGIN
  IF current_user_id IS NULL OR current_user_id = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT count(*)::INTEGER INTO referral_count
  FROM public.user_referrals
  WHERE referrer_user_id = current_user_id;

  bonus_calls := least(coalesce(referral_count, 0), bonus_cap);
  effective_limit := base_limit + bonus_calls;

  INSERT INTO public.ai_usage_daily (user_id, usage_date, successful_calls)
  VALUES (current_user_id, current_date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET successful_calls = public.ai_usage_daily.successful_calls + 1,
        updated_at = timezone('utc', now())
    WHERE public.ai_usage_daily.successful_calls < effective_limit
  RETURNING successful_calls INTO calls_used;

  IF NOT FOUND THEN
    SELECT successful_calls INTO calls_used
    FROM public.ai_usage_daily
    WHERE user_id = current_user_id
      AND usage_date = current_date;

    RETURN QUERY SELECT false, 0, effective_limit, coalesce(calls_used, effective_limit), bonus_calls;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, greatest(effective_limit - calls_used, 0), effective_limit, calls_used, bonus_calls;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_quota_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;

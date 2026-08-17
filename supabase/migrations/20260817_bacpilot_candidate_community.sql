-- BacPilot — résultats préparés, parrainage, avis et intentions de soutien.
-- Les paiements et la soumission de choix sur le portail officiel restent volontairement hors de ce schéma.

ALTER TABLE public.guide_programmes
  ADD COLUMN IF NOT EXISTS locality text NOT NULL DEFAULT '';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id text;

UPDATE public.profiles
SET referral_code = 'BP' || upper(right(replace(id::text, '-', ''), 10))
WHERE referral_code IS NULL OR btrim(referral_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique_idx
  ON public.profiles (upper(referral_code))
  WHERE referral_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_profile_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR btrim(NEW.referral_code) = '' THEN
    NEW.referral_code := 'BP' || upper(right(replace(NEW.id::text, '-', ''), 10));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_referral_code_before_insert ON public.profiles;
CREATE TRIGGER profiles_referral_code_before_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_profile_referral_code();

CREATE TABLE IF NOT EXISTS public.candidate_choice_preparations (
  user_id text PRIMARY KEY,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'exported', 'archived')),
  official_portal_url text NOT NULL DEFAULT 'https://apresmonbac.bj/',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 1 AND 3)
);

ALTER TABLE public.candidate_choice_preparations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.candidate_choice_preparations FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.candidate_choice_preparations TO authenticated;

DROP POLICY IF EXISTS candidate_choice_preparations_owner ON public.candidate_choice_preparations;
CREATE POLICY candidate_choice_preparations_owner
ON public.candidate_choice_preparations
FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id text NOT NULL,
  referred_user_id text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id),
  CHECK (referrer_user_id <> referred_user_id)
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_referrals FROM anon;
GRANT SELECT ON TABLE public.user_referrals TO authenticated;

DROP POLICY IF EXISTS user_referrals_owner_read ON public.user_referrals;
CREATE POLICY user_referrals_owner_read
ON public.user_referrals
FOR SELECT TO authenticated
USING (referrer_user_id = auth.uid()::text OR referred_user_id = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id text := auth.uid()::text;
  normalized_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  referrer_id text;
BEGIN
  IF current_user_id IS NULL OR current_user_id = '' THEN
    RAISE EXCEPTION 'Connexion requise.';
  END IF;

  SELECT id::text INTO referrer_id
  FROM public.profiles
  WHERE upper(regexp_replace(coalesce(referral_code, ''), '[^A-Za-z0-9]', '', 'g')) = normalized_code
  LIMIT 1;

  IF referrer_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'code_unknown');
  END IF;
  IF referrer_id = current_user_id THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'self_referral');
  END IF;

  INSERT INTO public.user_referrals (referrer_user_id, referred_user_id)
  VALUES (referrer_id, current_user_id)
  ON CONFLICT (referred_user_id) DO NOTHING;

  UPDATE public.profiles
  SET referred_by_user_id = referrer_id,
      updated_at = now()
  WHERE id::text = current_user_id
    AND (referred_by_user_id IS NULL OR referred_by_user_id = '');

  RETURN jsonb_build_object('applied', true);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_referral_summary()
RETURNS TABLE (referral_code text, invited_count bigint, reward_label text, next_milestone integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT id::text AS id, referral_code
    FROM public.profiles
    WHERE id::text = auth.uid()::text
    LIMIT 1
  ), counted AS (
    SELECT count(*)::bigint AS invited_count
    FROM public.user_referrals ur
    JOIN me ON me.id = ur.referrer_user_id
  )
  SELECT
    me.referral_code,
    counted.invited_count,
    CASE
      WHEN counted.invited_count >= 10 THEN 'Pionnier BacPilot'
      WHEN counted.invited_count >= 3 THEN 'Ambassadeur BacPilot'
      WHEN counted.invited_count >= 1 THEN 'Éclaireur BacPilot'
      ELSE 'Premier partage'
    END,
    CASE
      WHEN counted.invited_count < 1 THEN 1
      WHEN counted.invited_count < 3 THEN 3
      WHEN counted.invited_count < 10 THEN 10
      ELSE 0
    END
  FROM me CROSS JOIN counted;
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_summary() TO authenticated;

CREATE TABLE IF NOT EXISTS public.bacpilot_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1500),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  public_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NULL
);

ALTER TABLE public.bacpilot_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bacpilot_reviews FROM anon;
GRANT SELECT, INSERT ON TABLE public.bacpilot_reviews TO authenticated;

DROP POLICY IF EXISTS bacpilot_reviews_owner_read ON public.bacpilot_reviews;
CREATE POLICY bacpilot_reviews_owner_read
ON public.bacpilot_reviews
FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS bacpilot_reviews_owner_insert ON public.bacpilot_reviews;
CREATE POLICY bacpilot_reviews_owner_insert
ON public.bacpilot_reviews
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
  AND status = 'pending'
  AND public_consent = true
);

CREATE OR REPLACE FUNCTION public.list_published_bacpilot_reviews(p_limit integer DEFAULT 24)
RETURNS TABLE (id uuid, rating smallint, title text, body text, display_name text, published_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, rating, title, body, display_name, published_at
  FROM public.bacpilot_reviews
  WHERE status = 'published' AND public_consent = true
  ORDER BY published_at DESC NULLS LAST, created_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 24), 50));
$$;

REVOKE ALL ON FUNCTION public.list_published_bacpilot_reviews(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_published_bacpilot_reviews(integer) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.support_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  donor_name text NOT NULL CHECK (char_length(donor_name) BETWEEN 2 AND 120),
  contact_email text NOT NULL CHECK (position('@' in contact_email) > 1),
  amount_xof integer NOT NULL CHECK (amount_xof BETWEEN 100 AND 10000000),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 1000),
  recognition_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'awaiting_contact' CHECK (status IN ('awaiting_contact', 'contacted', 'confirmed', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.support_intents FROM anon;
GRANT SELECT, INSERT ON TABLE public.support_intents TO authenticated;

DROP POLICY IF EXISTS support_intents_owner_read ON public.support_intents;
CREATE POLICY support_intents_owner_read
ON public.support_intents
FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS support_intents_owner_insert ON public.support_intents;
CREATE POLICY support_intents_owner_insert
ON public.support_intents
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text AND status = 'awaiting_contact');

CREATE TABLE IF NOT EXISTS public.supporter_recognitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_intent_id uuid NULL REFERENCES public.support_intents(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  photo_url text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 300),
  consent_at timestamptz NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supporter_recognitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.supporter_recognitions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_featured_supporters(p_limit integer DEFAULT 24)
RETURNS TABLE (id uuid, full_name text, photo_url text, note text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, photo_url, note
  FROM public.supporter_recognitions
  WHERE featured = true
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 24), 50));
$$;

REVOKE ALL ON FUNCTION public.list_featured_supporters(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_featured_supporters(integer) TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bacpilot_reviews, public.support_intents, public.supporter_recognitions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_referrals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_choice_preparations TO service_role;

CREATE OR REPLACE FUNCTION public.set_bacpilot_community_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidate_choice_preparations_updated_at ON public.candidate_choice_preparations;
CREATE TRIGGER candidate_choice_preparations_updated_at
BEFORE UPDATE ON public.candidate_choice_preparations
FOR EACH ROW EXECUTE FUNCTION public.set_bacpilot_community_updated_at();

DROP TRIGGER IF EXISTS bacpilot_reviews_updated_at ON public.bacpilot_reviews;
CREATE TRIGGER bacpilot_reviews_updated_at
BEFORE UPDATE ON public.bacpilot_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_bacpilot_community_updated_at();

DROP TRIGGER IF EXISTS support_intents_updated_at ON public.support_intents;
CREATE TRIGGER support_intents_updated_at
BEFORE UPDATE ON public.support_intents
FOR EACH ROW EXECUTE FUNCTION public.set_bacpilot_community_updated_at();

COMMENT ON TABLE public.candidate_choice_preparations IS 'Préparation privée de 1 à 3 choix. BacPilot ne soumet jamais ces choix sur le portail officiel.';
COMMENT ON TABLE public.support_intents IS 'Intention de soutien sans paiement intégré. Toute transaction éventuelle reste hors BacPilot et nécessite un échange direct.';

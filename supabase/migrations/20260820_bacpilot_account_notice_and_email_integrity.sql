-- BacPilot — sécurité des adresses, avis privés et conservation des traces de suppression.
-- Une suppression définitive ne peut pas être rendue visible dans l’application : le compte n’existerait plus.
-- Pour une adresse absente ou non exploitable, l’opérateur peut donc d’abord suspendre le compte
-- et afficher un avis uniquement à son titulaire connecté.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended_notice')),
  ADD COLUMN IF NOT EXISTS account_notice_title TEXT,
  ADD COLUMN IF NOT EXISTS account_notice_body TEXT,
  ADD COLUMN IF NOT EXISTS account_notice_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_notice_reason TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_format_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_format_check
  CHECK (
    email IS NULL
    OR btrim(email) ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ) NOT VALID;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_notice_consistency_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_notice_consistency_check
  CHECK (
    (account_status = 'active' AND account_notice_title IS NULL AND account_notice_body IS NULL AND account_notice_created_at IS NULL)
    OR (
      account_status = 'suspended_notice'
      AND char_length(coalesce(account_notice_title, '')) BETWEEN 3 AND 160
      AND char_length(coalesce(account_notice_body, '')) BETWEEN 10 AND 1600
      AND account_notice_created_at IS NOT NULL
    )
  );

COMMENT ON COLUMN public.profiles.account_status IS
  'État privé du compte. suspended_notice bloque les parcours applicatifs et montre un avis uniquement au titulaire connecté.';
COMMENT ON COLUMN public.profiles.account_notice_reason IS
  'Motif opérateur normalisé ou personnalisé ; réservé au titulaire concerné et au service_role.';

CREATE OR REPLACE FUNCTION public.guard_profile_account_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  request_role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'L’adresse e-mail de profil est liée à l’identité Auth et ne peut pas être modifiée ici.';
    END IF;

    IF (
      NEW.account_status IS DISTINCT FROM OLD.account_status
      OR NEW.account_notice_title IS DISTINCT FROM OLD.account_notice_title
      OR NEW.account_notice_body IS DISTINCT FROM OLD.account_notice_body
      OR NEW.account_notice_created_at IS DISTINCT FROM OLD.account_notice_created_at
      OR NEW.account_notice_reason IS DISTINCT FROM OLD.account_notice_reason
    ) AND coalesce(request_role, '') <> 'service_role' THEN
      RAISE EXCEPTION 'Les statuts et avis de sécurité sont administrés uniquement par BacPilot.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_account_security_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bacpilot_guard_profile_account_security ON public.profiles;
CREATE TRIGGER bacpilot_guard_profile_account_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_account_security_fields();

-- Crée le profil côté serveur dès l’insertion Auth. Le flux reste fiable même lorsqu’une
-- confirmation e-mail empêche l’ouverture immédiate d’une session côté navigateur.
CREATE OR REPLACE FUNCTION public.create_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    signup_intent,
    signup_entrypoint,
    signup_route,
    signup_device_class,
    signup_browser,
    signup_context_consent_at
  ) VALUES (
    NEW.id::text,
    coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'display_name'), ''), 'Nouveau Bachelier'),
    lower(nullif(trim(NEW.email), '')),
    CASE WHEN NEW.raw_user_meta_data ->> 'signup_intent' = 'beta_interest' THEN 'beta_interest' ELSE 'standard' END,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'signup_entrypoint' IN ('direct', 'beta_portal', 'partner_portal', 'other')
      THEN NEW.raw_user_meta_data ->> 'signup_entrypoint'
      ELSE 'direct'
    END,
    nullif(left(NEW.raw_user_meta_data ->> 'signup_route', 160), ''),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'signup_device_class' IN ('mobile', 'tablet', 'desktop', 'unknown')
      THEN NEW.raw_user_meta_data ->> 'signup_device_class'
      ELSE 'unknown'
    END,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'signup_browser' IN ('Chrome', 'Safari', 'Firefox', 'Edge', 'Other')
      THEN NEW.raw_user_meta_data ->> 'signup_browser'
      ELSE 'Other'
    END,
    CASE
      WHEN nullif(trim(NEW.raw_user_meta_data ->> 'signup_context_consent_at'), '') IS NOT NULL THEN timezone('utc', now())
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_profile_from_auth_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bacpilot_create_profile_from_auth_user ON auth.users;
CREATE TRIGGER bacpilot_create_profile_from_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_from_auth_user();

-- Le journal de livraison d’un message de suppression doit survivre au nettoyage du profil.
ALTER TABLE public.operator_email_deliveries
  ALTER COLUMN target_user_id DROP NOT NULL;
ALTER TABLE public.operator_email_deliveries
  DROP CONSTRAINT IF EXISTS operator_email_deliveries_target_user_id_fkey;
ALTER TABLE public.operator_email_deliveries
  ADD CONSTRAINT operator_email_deliveries_target_user_id_fkey
  FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.operator_email_deliveries
  ADD COLUMN IF NOT EXISTS operator_action_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS operator_email_deliveries_operator_action_uidx
  ON public.operator_email_deliveries(operator_action_id)
  WHERE operator_action_id IS NOT NULL;

-- L’audit administratif subsiste aussi après la suppression du profil ciblé.
ALTER TABLE public.operator_command_audit
  DROP CONSTRAINT IF EXISTS operator_command_audit_target_user_id_fkey;
ALTER TABLE public.operator_command_audit
  ADD CONSTRAINT operator_command_audit_target_user_id_fkey
  FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.operator_pending_actions
  DROP CONSTRAINT IF EXISTS operator_pending_actions_action_check;
ALTER TABLE public.operator_pending_actions
  ADD CONSTRAINT operator_pending_actions_action_check
  CHECK (action IN (
    'beta_activate',
    'beta_pause',
    'beta_revoke',
    'user_delete',
    'user_notice_suspend',
    'collector_revoke',
    'email_send',
    'email_campaign_recognition'
  ));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_expected_input_check;
ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_expected_input_check
  CHECK (expected_input = ANY (ARRAY[
    'user_identifier'::text,
    'beta_user_identifier'::text,
    'confirmation_ack'::text,
    'menu_choice'::text,
    'email_recipient'::text,
    'email_subject'::text,
    'email_body'::text,
    'deletion_reason'::text
  ]));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_origin_command_check;
ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_origin_command_check
  CHECK (origin_command = ANY (ARRAY[
    '/start'::text,
    '/help'::text,
    '/menu'::text,
    '/status'::text,
    '/stats'::text,
    '/user'::text,
    '/email'::text,
    '/welcome'::text,
    '/mailstatus'::text,
    '/user_delete'::text,
    '/beta_add'::text,
    '/beta_pause'::text,
    '/beta_revoke'::text,
    '/confirm'::text,
    '/cancel'::text
  ]));

GRANT EXECUTE ON FUNCTION public.create_profile_from_auth_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_profile_account_security_fields() TO service_role;

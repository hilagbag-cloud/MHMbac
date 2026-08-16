-- BacPilot — contexte d’inscription minimal pour l’opérateur
-- Objectif : permettre la validation des demandes bêta sans collecter d’IP,
-- de mot de passe, de jeton, de cookie, de session brute ou d’empreinte détaillée.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_intent TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS signup_entrypoint TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS signup_route TEXT,
  ADD COLUMN IF NOT EXISTS signup_device_class TEXT,
  ADD COLUMN IF NOT EXISTS signup_browser TEXT,
  ADD COLUMN IF NOT EXISTS signup_context_consent_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_signup_intent_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_signup_intent_check
  CHECK (signup_intent IN ('standard', 'beta_interest'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_signup_entrypoint_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_signup_entrypoint_check
  CHECK (signup_entrypoint IN ('direct', 'beta_portal', 'partner_portal', 'other'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_signup_device_class_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_signup_device_class_check
  CHECK (signup_device_class IS NULL OR signup_device_class IN ('mobile', 'tablet', 'desktop', 'unknown'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_signup_browser_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_signup_browser_check
  CHECK (signup_browser IS NULL OR signup_browser IN ('Chrome', 'Safari', 'Firefox', 'Edge', 'Other'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_signup_route_length_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_signup_route_length_check
  CHECK (signup_route IS NULL OR char_length(signup_route) <= 160);

CREATE INDEX IF NOT EXISTS profiles_signup_intent_created_at_idx
  ON public.profiles (signup_intent, created_at DESC);

COMMENT ON COLUMN public.profiles.signup_intent IS
  'Intention déclarée à la création : utilisation standard ou demande d’accès bêta. Ne confère jamais le statut bêta.';
COMMENT ON COLUMN public.profiles.signup_entrypoint IS
  'Point d’entrée normalisé de l’inscription. Pas de référent brut ni de paramètres de requête.';
COMMENT ON COLUMN public.profiles.signup_route IS
  'Chemin public normalisé de l’inscription, sans paramètres ni fragment.';
COMMENT ON COLUMN public.profiles.signup_device_class IS
  'Catégorie de terminal dérivée localement et limitée à mobile/tablet/desktop/unknown.';
COMMENT ON COLUMN public.profiles.signup_browser IS
  'Famille de navigateur dérivée localement. Aucun user-agent brut conservé.';
COMMENT ON COLUMN public.profiles.signup_context_consent_at IS
  'Horodatage du consentement explicite au contexte technique minimal pour une demande bêta.';

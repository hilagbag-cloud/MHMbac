-- BacPilot — retours bêta écrits par leur auteur, puis notifiés de manière asynchrone.
-- Les privilèges de table sont minimaux ; les politiques RLS existantes restent la barrière d’accès.
GRANT SELECT, INSERT ON TABLE public.beta_feedback TO authenticated;
GRANT SELECT, INSERT ON TABLE public.beta_test_events TO authenticated;
GRANT SELECT ON TABLE public.beta_testers TO authenticated;

CREATE TABLE IF NOT EXISTS public.operator_feedback_deliveries (
  feedback_id uuid PRIMARY KEY REFERENCES public.beta_feedback(id) ON DELETE CASCADE,
  telegram_status text NOT NULL DEFAULT 'pending' CHECK (telegram_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_status text NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped', 'not_configured')),
  delivery_attempts integer NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0 AND delivery_attempts <= 9),
  telegram_sent_at timestamptz,
  email_sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.operator_feedback_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.operator_feedback_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.operator_feedback_deliveries TO service_role;

CREATE OR REPLACE FUNCTION public.queue_beta_feedback_operator_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  webhook_secret text;
BEGIN
  SELECT ds.decrypted_secret
    INTO webhook_secret
  FROM vault.decrypted_secrets AS ds
  WHERE ds.name = 'bacpilot_db_webhook_secret'
  LIMIT 1;

  IF webhook_secret IS NULL OR length(webhook_secret) < 24 THEN
    RAISE WARNING 'BacPilot retour bêta : secret webhook Vault absent.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/notify-beta-feedback',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'beta_feedback',
      'schema', 'public',
      'record', to_jsonb(NEW),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-bacpilot-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Un retour utilisateur ne doit jamais être refusé parce qu’une notification est indisponible.
    RAISE WARNING 'BacPilot retour bêta : notification non planifiée : %', sqlerrm;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_beta_feedback_operator_notification() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS bacpilot_notify_beta_feedback ON public.beta_feedback;
CREATE TRIGGER bacpilot_notify_beta_feedback
  AFTER INSERT ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_beta_feedback_operator_notification();

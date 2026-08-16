-- BacPilot — journal d’envoi des emails transactionnels bêta.
CREATE TABLE IF NOT EXISTS public.beta_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('beta_activated')),
  recipient_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'not_configured', 'skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (user_id, event_type)
);

ALTER TABLE public.beta_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.beta_email_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.beta_email_deliveries TO service_role;

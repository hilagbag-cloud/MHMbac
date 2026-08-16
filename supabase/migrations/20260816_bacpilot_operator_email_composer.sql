-- BacPilot — journal des emails personnalisés envoyés depuis la console opérateur.
CREATE TABLE IF NOT EXISTS public.operator_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id text NOT NULL,
  target_user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  body_text text NOT NULL CHECK (char_length(body_text) BETWEEN 1 AND 6000),
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'not_configured', 'skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  sent_at timestamptz
);

ALTER TABLE public.operator_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operator_email_deliveries FROM anon, authenticated;

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_expected_input_check;
ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_expected_input_check
  CHECK (expected_input = ANY (ARRAY[
    'user_identifier'::text,
    'beta_user_identifier'::text,
    'confirmation_ack'::text,
    'menu_choice'::text,
    'email_subject'::text,
    'email_body'::text
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
    '/user_delete'::text,
    '/beta_add'::text,
    '/beta_pause'::text,
    '/beta_revoke'::text,
    '/confirm'::text,
    '/cancel'::text
  ]));

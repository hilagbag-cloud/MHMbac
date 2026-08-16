-- BacPilot — navigation persistante de la console opérateur Telegram.
ALTER TABLE public.operator_input_sessions
  ADD COLUMN IF NOT EXISTS menu_state text,
  ADD COLUMN IF NOT EXISTS menu_context jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_expected_input_check;
ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_expected_input_check
  CHECK (expected_input = ANY (ARRAY['user_identifier'::text, 'beta_user_identifier'::text, 'confirmation_ack'::text, 'menu_choice'::text]));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_origin_command_check;
ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_origin_command_check
  CHECK (origin_command = ANY (ARRAY['/start'::text, '/help'::text, '/menu'::text, '/status'::text, '/stats'::text, '/user'::text, '/user_delete'::text, '/beta_add'::text, '/beta_pause'::text, '/beta_revoke'::text, '/confirm'::text, '/cancel'::text]));

-- BacPilot — étapes de personnalisation de la campagne de retour dans Telegram
-- Les sessions ne préparent aucune campagne tant que toutes les étapes ne sont pas terminées.

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
    'deletion_reason'::text,
    'campaign_return_days'::text,
    'campaign_return_subject'::text,
    'campaign_return_body'::text
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
    '/cancel'::text,
    '/orientation_return_draft'::text
  ]));

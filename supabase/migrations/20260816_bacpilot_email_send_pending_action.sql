-- Autorise l’action email_send dans le même circuit sécurisé de confirmation opérateur.
ALTER TABLE public.operator_pending_actions
  DROP CONSTRAINT IF EXISTS operator_pending_actions_action_check;
ALTER TABLE public.operator_pending_actions
  ADD CONSTRAINT operator_pending_actions_action_check
  CHECK (action = ANY (ARRAY[
    'beta_activate'::text,
    'beta_pause'::text,
    'beta_revoke'::text,
    'user_delete'::text,
    'email_send'::text
  ]));

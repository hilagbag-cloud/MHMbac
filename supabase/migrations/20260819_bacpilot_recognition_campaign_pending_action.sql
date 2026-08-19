-- BacPilot — campagne d’invitation à la reconnaissance des contributeurs bêta.
-- L’envoi reste obligatoirement créé comme une action en attente puis confirmé par l’opérateur Telegram.

ALTER TABLE public.operator_pending_actions
  DROP CONSTRAINT IF EXISTS operator_pending_actions_action_check;

ALTER TABLE public.operator_pending_actions
  ADD CONSTRAINT operator_pending_actions_action_check
  CHECK (action IN (
    'beta_activate',
    'beta_pause',
    'beta_revoke',
    'user_delete',
    'collector_revoke',
    'email_send',
    'email_campaign_recognition'
  ));

COMMENT ON CONSTRAINT operator_pending_actions_action_check ON public.operator_pending_actions IS
  'Seules les opérations opérateur explicitement confirmables sont autorisées, y compris la campagne de reconnaissance bêta.';

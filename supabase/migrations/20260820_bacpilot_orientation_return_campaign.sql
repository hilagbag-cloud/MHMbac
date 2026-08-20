-- BacPilot — campagne de retour orientation préparée et confirmée par opérateur uniquement
-- Étend la liste d’actions pendantes sans modifier les campagnes ou utilisateurs existants.

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
    'email_campaign_recognition',
    'email_campaign_orientation_return'
  ));

COMMENT ON CONSTRAINT operator_pending_actions_action_check ON public.operator_pending_actions IS
  'Actions opérateur confirmables, dont les campagnes restent des brouillons jusqu’à confirmation explicite.';

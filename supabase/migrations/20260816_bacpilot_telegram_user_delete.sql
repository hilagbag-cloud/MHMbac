-- BacPilot — extension sécurisée de la console opérateur : suppression définitive d’un compte.
-- L’action reste réservée au service_role, passe obligatoirement par une action en attente
-- expirant au bout de 10 minutes, puis par la confirmation explicite « SUPPRIMER ».

ALTER TABLE public.operator_pending_actions
  DROP CONSTRAINT IF EXISTS operator_pending_actions_action_check;

ALTER TABLE public.operator_pending_actions
  ADD CONSTRAINT operator_pending_actions_action_check
  CHECK (action IN ('beta_activate', 'beta_pause', 'beta_revoke', 'user_delete'));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_origin_command_check;

ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_origin_command_check
  CHECK (origin_command IN ('/user', '/user_delete', '/beta_add', '/beta_pause', '/beta_revoke', '/confirm'));

-- La suppression du profil intervient après la suppression Auth, afin de conserver les
-- cascades natives sur beta_testers, retours, événements et sessions d’authentification.
GRANT DELETE ON TABLE public.profiles TO service_role;

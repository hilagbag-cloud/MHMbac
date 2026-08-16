-- BacPilot — révocation contrôlée des collecteurs par l’opérateur Telegram
alter table public.operator_pending_actions
  drop constraint if exists operator_pending_actions_action_check;

alter table public.operator_pending_actions
  add constraint operator_pending_actions_action_check
  check (action in ('beta_activate', 'beta_pause', 'beta_revoke', 'user_delete', 'collector_revoke', 'email_send'));

grant update on table public.collector_devices to service_role;

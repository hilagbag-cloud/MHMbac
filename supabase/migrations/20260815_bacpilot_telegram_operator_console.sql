-- BacPilot — console opérateur Telegram.
-- Ces tables ne sont accessibles qu'aux fonctions serveur utilisant service_role.

create table if not exists public.operator_command_audit (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text not null,
  command text not null check (char_length(command) between 1 and 80),
  target_user_id text references public.profiles(id) on delete set null,
  outcome text not null check (outcome in ('read', 'pending', 'confirmed', 'cancelled', 'rejected', 'failed')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.operator_pending_actions (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text not null,
  action text not null check (action in ('beta_activate', 'beta_pause', 'beta_revoke')),
  target_user_id text not null references public.profiles(id) on delete cascade,
  confirmation_code text not null unique check (confirmation_code ~ '^[A-Z0-9]{8}$'),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  expires_at timestamptz not null,
  executed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at)
);

create index if not exists operator_command_audit_created_at_idx
  on public.operator_command_audit (created_at desc);

create index if not exists operator_command_audit_target_user_idx
  on public.operator_command_audit (target_user_id, created_at desc);

create index if not exists operator_pending_actions_lookup_idx
  on public.operator_pending_actions (telegram_chat_id, confirmation_code, expires_at desc)
  where executed_at is null and cancelled_at is null;

alter table public.operator_command_audit enable row level security;
alter table public.operator_pending_actions enable row level security;

revoke all on table public.operator_command_audit from anon, authenticated;
revoke all on table public.operator_pending_actions from anon, authenticated;

grant select, insert, update, delete on table public.operator_command_audit to service_role;
grant select, insert, update, delete on table public.operator_pending_actions to service_role;

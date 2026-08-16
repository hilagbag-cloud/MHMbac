-- Sessions de saisie conversationnelle de la console Telegram.
-- Une seule demande active par chat opérateur ; expiration courte et accès serveur uniquement.

create table if not exists public.operator_input_sessions (
  telegram_chat_id text primary key,
  expected_input text not null check (expected_input in ('user_identifier', 'beta_user_identifier')),
  origin_command text not null check (origin_command in ('/user', '/beta_add', '/beta_pause', '/beta_revoke')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at)
);

create index if not exists operator_input_sessions_expires_idx
  on public.operator_input_sessions (expires_at);

alter table public.operator_input_sessions enable row level security;
revoke all on table public.operator_input_sessions from anon, authenticated;
grant select, insert, update, delete on table public.operator_input_sessions to service_role;

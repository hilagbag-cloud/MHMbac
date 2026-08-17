-- Suivi idempotent des notifications d'incident envoyées aux utilisateurs.
create table if not exists public.incident_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (incident_code, user_id)
);

alter table public.incident_email_deliveries enable row level security;
revoke all on public.incident_email_deliveries from anon, authenticated;
create index if not exists incident_email_deliveries_incident_idx
  on public.incident_email_deliveries (incident_code, status);

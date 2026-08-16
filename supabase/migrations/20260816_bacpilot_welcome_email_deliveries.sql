-- BacPilot: automatic welcome email delivery ledger
create table if not exists public.welcome_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  attempts integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.welcome_email_deliveries enable row level security;
revoke all on public.welcome_email_deliveries from anon, authenticated;
grant all on public.welcome_email_deliveries to service_role;

create index if not exists welcome_email_deliveries_status_idx
  on public.welcome_email_deliveries(status, updated_at desc);

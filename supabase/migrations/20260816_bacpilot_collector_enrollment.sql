-- BacPilot — enrôlement d’un collecteur Chrome par appareil
-- Aucun accès navigateur : les fonctions Edge et la console Telegram utilisent service_role.

create table if not exists public.collector_activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text,
  status text not null default 'issued' check (status in ('issued', 'consumed', 'revoked', 'expired')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists collector_activation_codes_active_idx
  on public.collector_activation_codes (status, expires_at);

create table if not exists public.collector_devices (
  id uuid primary key default gen_random_uuid(),
  label text,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  last_preflight_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now()
);

create index if not exists collector_devices_status_seen_idx
  on public.collector_devices (status, last_seen_at desc);

alter table public.sync_batch_receipts
  add column if not exists collector_id uuid references public.collector_devices(id) on delete set null;

create index if not exists sync_batch_receipts_collector_idx
  on public.sync_batch_receipts (collector_id, received_at desc);

alter table public.collector_activation_codes enable row level security;
alter table public.collector_devices enable row level security;

revoke all on public.collector_activation_codes from anon, authenticated;
revoke all on public.collector_devices from anon, authenticated;
grant all on public.collector_activation_codes to service_role;
grant all on public.collector_devices to service_role;

comment on table public.collector_activation_codes is 'Codes d’activation à usage unique pour enrôler une extension BacPilot ; code en clair jamais stocké.';
comment on table public.collector_devices is 'Collecteurs Chrome BacPilot identifiés par appareil ; token en clair jamais stocké, révocation individuelle.';
comment on column public.collector_activation_codes.code_hash is 'Empreinte SHA-256 du code communiqué une seule fois par l’opérateur.';
comment on column public.collector_devices.token_hash is 'Empreinte SHA-256 du token remis à l’extension après activation.';
comment on column public.sync_batch_receipts.collector_id is 'Collecteur ayant émis le lot ; NULL pour les lots legacy synchronisés avant enrôlement.';

-- BacPilot — suivi de livraison transactionnelle à partir de l’état Resend consulté par l’opérateur.
-- Les statuts existants conservent leur sens : « sent » signifie accepté par le fournisseur.
-- Le dernier événement Resend (delivered, bounced, opened, etc.) est stocké séparément.

alter table public.welcome_email_deliveries
  add column if not exists provider_last_event text,
  add column if not exists provider_checked_at timestamptz;

alter table public.beta_email_deliveries
  add column if not exists provider_last_event text,
  add column if not exists provider_checked_at timestamptz;

alter table public.operator_email_deliveries
  add column if not exists provider_last_event text,
  add column if not exists provider_checked_at timestamptz;

-- La table a été créée après les grants initiaux de la console Telegram.
-- Seul le rôle de service utilisé par les Edge Functions reçoit ces droits.
grant select, insert, update, delete on table public.operator_email_deliveries to service_role;

grant select, insert, update on table public.welcome_email_deliveries to service_role;
grant select, insert, update on table public.beta_email_deliveries to service_role;

create index if not exists operator_email_deliveries_target_created_idx
  on public.operator_email_deliveries (target_user_id, created_at desc);

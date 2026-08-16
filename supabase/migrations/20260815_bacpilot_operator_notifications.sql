-- BacPilot — journal privé et idempotent des alertes opérateur.
-- Aucun jeton Telegram ni secret de webhook n'est stocké dans cette migration.

create table if not exists public.operator_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('telegram')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  delivery_attempts smallint not null default 0 check (delivery_attempts >= 0 and delivery_attempts <= 9),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, channel)
);

alter table public.operator_notifications enable row level security;

-- Aucun accès navigateur : ce journal est exploité uniquement par les fonctions serveur.
revoke all on table public.operator_notifications from anon, authenticated;

grant select, insert, update, delete on table public.operator_notifications to service_role;

create or replace function public.bacpilot_operator_notifications_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.bacpilot_operator_notifications_set_updated_at() from public, anon, authenticated;
grant execute on function public.bacpilot_operator_notifications_set_updated_at() to service_role;

drop trigger if exists bacpilot_operator_notifications_updated_at on public.operator_notifications;
create trigger bacpilot_operator_notifications_updated_at
before update on public.operator_notifications
for each row execute function public.bacpilot_operator_notifications_set_updated_at();

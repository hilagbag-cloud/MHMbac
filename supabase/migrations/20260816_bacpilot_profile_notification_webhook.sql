-- Déclencheur asynchrone d’alerte opérateur pour chaque nouveau profil BacPilot.
-- Le secret n’est jamais versionné : il est lu dans Supabase Vault sous le nom
-- `bacpilot_db_webhook_secret`, puis transmis uniquement au webhook interne.

create extension if not exists pg_net;

create or replace function public.queue_new_profile_operator_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  webhook_secret text;
begin
  select ds.decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets as ds
  where ds.name = 'bacpilot_db_webhook_secret'
  limit 1;

  if webhook_secret is null or length(webhook_secret) < 24 then
    raise warning 'BacPilot notification opérateur ignorée : secret Vault absent.';
    return new;
  end if;

  perform net.http_post(
    url := 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/notify-new-user',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-bacpilot-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    -- L’inscription ne doit jamais être bloquée par une indisponibilité réseau.
    raise warning 'BacPilot notification opérateur non planifiée : %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.queue_new_profile_operator_notification() from public, anon, authenticated;

drop trigger if exists bacpilot_notify_new_profile on public.profiles;
create trigger bacpilot_notify_new_profile
  after insert on public.profiles
  for each row
  execute function public.queue_new_profile_operator_notification();

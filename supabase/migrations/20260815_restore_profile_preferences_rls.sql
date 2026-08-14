-- Restore authenticated profile and preference writes for the production web client.
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists user_preferences_select_own on public.user_preferences;
drop policy if exists user_preferences_insert_own on public.user_preferences;
drop policy if exists user_preferences_update_own on public.user_preferences;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid()::text = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid()::text = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create policy user_preferences_select_own on public.user_preferences
  for select to authenticated using (auth.uid()::text = user_id);
create policy user_preferences_insert_own on public.user_preferences
  for insert to authenticated with check (auth.uid()::text = user_id);
create policy user_preferences_update_own on public.user_preferences
  for update to authenticated using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

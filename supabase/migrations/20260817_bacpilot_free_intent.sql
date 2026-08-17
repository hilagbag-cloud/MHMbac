ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS free_intent text;

COMMENT ON COLUMN public.user_preferences.free_intent IS
  'Intentions et précisions libres du candidat, utilisées comme signal de recherche et jamais comme preuve d’éligibilité.';

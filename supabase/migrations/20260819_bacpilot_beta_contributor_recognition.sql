-- BacPilot — reconnaissance des bêta-testeurs
-- Les données publiques sont strictement séparées du profil candidat et restent privées par défaut.

CREATE TABLE IF NOT EXISTS public.beta_contributor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_name TEXT,
  public_bio TEXT,
  focus_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  photo_path TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  visibility_level TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility_level IN ('private', 'name_only', 'profile')),
  profile_consent_at TIMESTAMPTZ,
  photo_consent_at TIMESTAMPTZ,
  search_indexing_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT beta_contributor_public_name_length
    CHECK (public_name IS NULL OR char_length(trim(public_name)) BETWEEN 2 AND 80),
  CONSTRAINT beta_contributor_public_bio_length
    CHECK (public_bio IS NULL OR char_length(trim(public_bio)) <= 420),
  CONSTRAINT beta_contributor_focus_areas_limit
    CHECK (cardinality(focus_areas) <= 6),
  CONSTRAINT beta_contributor_portfolio_https
    CHECK (portfolio_url IS NULL OR portfolio_url ~ '^https://'),
  CONSTRAINT beta_contributor_linkedin_https
    CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https://www\.linkedin\.com/'),
  CONSTRAINT beta_contributor_public_consent
    CHECK (
      visibility_level = 'private'
      OR (public_name IS NOT NULL AND profile_consent_at IS NOT NULL)
    )
);

ALTER TABLE public.beta_contributor_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.beta_contributor_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.beta_contributor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.beta_contributor_profiles TO service_role;

DROP POLICY IF EXISTS "beta_contributor_profiles_select_own" ON public.beta_contributor_profiles;
CREATE POLICY "beta_contributor_profiles_select_own"
  ON public.beta_contributor_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_contributor_profiles_insert_active_beta" ON public.beta_contributor_profiles;
CREATE POLICY "beta_contributor_profiles_insert_active_beta"
  ON public.beta_contributor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid() AND bt.status = 'active'
    )
  );

DROP POLICY IF EXISTS "beta_contributor_profiles_update_own" ON public.beta_contributor_profiles;
CREATE POLICY "beta_contributor_profiles_update_own"
  ON public.beta_contributor_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.beta_contributor_profiles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.beta_contributor_profiles_set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_beta_contributor_profiles_updated ON public.beta_contributor_profiles;
CREATE TRIGGER on_beta_contributor_profiles_updated
  BEFORE UPDATE ON public.beta_contributor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.beta_contributor_profiles_set_updated_at();

-- Les photos sont privées : le répertoire public utilisera des URL signées seulement
-- pour les profils qui ont donné les consentements requis.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beta-contributor-photos',
  'beta-contributor-photos',
  false,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "beta_contributor_photos_insert_own" ON storage.objects;
CREATE POLICY "beta_contributor_photos_insert_own"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'beta-contributor-photos'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid() AND bt.status = 'active'
    )
  );

DROP POLICY IF EXISTS "beta_contributor_photos_select_own" ON storage.objects;
CREATE POLICY "beta_contributor_photos_select_own"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'beta-contributor-photos'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "beta_contributor_photos_update_own" ON storage.objects;
CREATE POLICY "beta_contributor_photos_update_own"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'beta-contributor-photos'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'beta-contributor-photos'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "beta_contributor_photos_delete_own" ON storage.objects;
CREATE POLICY "beta_contributor_photos_delete_own"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'beta-contributor-photos'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- L’indice est calculé à la lecture et plafonné : il ne peut pas être gonflé
-- par des rechargements répétitifs ou une quantité illimitée de retours.
CREATE OR REPLACE FUNCTION public.get_my_beta_contribution_summary()
RETURNS TABLE (
  contribution_score INTEGER,
  contribution_level TEXT,
  unique_test_actions INTEGER,
  feedback_submitted INTEGER,
  feedback_taken_into_account INTEGER,
  feedback_resolved INTEGER,
  score_exploration INTEGER,
  score_feedback INTEGER,
  score_taken_into_account INTEGER,
  score_resolved INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active_beta AS (
    SELECT 1
    FROM public.beta_testers
    WHERE user_id = auth.uid() AND status = 'active'
  ),
  activity_counts AS (
    SELECT LEAST(
      COUNT(DISTINCT concat_ws('|', event_type, COALESCE(zone, ''), COALESCE(route, ''))),
      5
    )::INTEGER AS action_count
    FROM public.beta_test_events
    WHERE user_id = auth.uid()
  ),
  feedback_counts AS (
    SELECT
      LEAST(COUNT(*), 3)::INTEGER AS submitted_count,
      LEAST(COUNT(*) FILTER (WHERE status IN ('triaged', 'in_progress', 'resolved')), 3)::INTEGER AS accepted_count,
      LEAST(COUNT(*) FILTER (WHERE status = 'resolved'), 3)::INTEGER AS resolved_count
    FROM public.beta_feedback
    WHERE user_id = auth.uid()
  ),
  contribution_points AS (
    SELECT
      (activity_counts.action_count * 5)::INTEGER AS exploration_points,
      (feedback_counts.submitted_count * 10)::INTEGER AS feedback_points,
      (feedback_counts.accepted_count * 10)::INTEGER AS accepted_points,
      (feedback_counts.resolved_count * 5)::INTEGER AS resolved_points,
      activity_counts.action_count,
      feedback_counts.submitted_count,
      feedback_counts.accepted_count,
      feedback_counts.resolved_count
    FROM activity_counts CROSS JOIN feedback_counts
  ),
  total_points AS (
    SELECT *, LEAST(exploration_points + feedback_points + accepted_points + resolved_points, 100)::INTEGER AS total
    FROM contribution_points
  )
  SELECT
    total_points.total AS contribution_score,
    CASE
      WHEN total_points.total >= 80 THEN 'Pionnier bêta'
      WHEN total_points.total >= 50 THEN 'Contributeur actif'
      WHEN total_points.total >= 20 THEN 'Explorateur engagé'
      ELSE 'Découvreur bêta'
    END AS contribution_level,
    total_points.action_count,
    total_points.submitted_count,
    total_points.accepted_count,
    total_points.resolved_count,
    total_points.exploration_points,
    total_points.feedback_points,
    total_points.accepted_points,
    total_points.resolved_points
  FROM total_points
  WHERE EXISTS (SELECT 1 FROM active_beta);
$$;

REVOKE ALL ON FUNCTION public.get_my_beta_contribution_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_beta_contribution_summary() TO authenticated, service_role;

COMMENT ON TABLE public.beta_contributor_profiles IS
  'Profil de reconnaissance optionnel des bêta-testeurs ; aucun champ académique, e-mail ou retour privé n’y est stocké.';
COMMENT ON FUNCTION public.get_my_beta_contribution_summary() IS
  'Indice de contribution automatique, calculé à partir des actions bêta uniques et des retours réellement pris en compte.';

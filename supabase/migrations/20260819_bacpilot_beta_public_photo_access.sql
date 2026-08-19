-- BacPilot — lecture publique limitée des photos de contributeurs consentants.
-- Le bucket demeure privé : une URL signée ne peut être créée que si le profil est publié,
-- indexable et a donné un consentement photo explicite.

DROP POLICY IF EXISTS "beta_contributor_photos_select_public_consent" ON storage.objects;
CREATE POLICY "beta_contributor_photos_select_public_consent"
  ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'beta-contributor-photos'
    AND EXISTS (
      SELECT 1
      FROM public.beta_contributor_profiles cp
      JOIN public.beta_testers bt ON bt.user_id = cp.user_id
      WHERE cp.user_id::TEXT = (storage.foldername(name))[1]
        AND cp.photo_path = name
        AND cp.visibility_level = 'profile'
        AND cp.profile_consent_at IS NOT NULL
        AND cp.photo_consent_at IS NOT NULL
        AND cp.search_indexing_consent_at IS NOT NULL
        AND bt.status = 'active'
    )
  );

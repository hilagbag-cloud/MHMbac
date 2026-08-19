-- BacPilot — sitemap dynamique des fiches individuelles publiées.
-- Aucun nom, e-mail ou identifiant utilisateur n’est renvoyé.

CREATE OR REPLACE FUNCTION public.list_public_beta_contributor_sitemap(p_limit INTEGER DEFAULT 250)
RETURNS TABLE (
  public_slug TEXT,
  public_updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.public_slug, COALESCE(cp.public_updated_at, cp.updated_at)
  FROM public.beta_contributor_profiles cp
  JOIN public.beta_testers bt ON bt.user_id = cp.user_id
  WHERE bt.status = 'active'
    AND cp.publication_status = 'published_profile'
    AND cp.public_slug IS NOT NULL
    AND cp.profile_consent_at IS NOT NULL
    AND cp.search_indexing_consent_at IS NOT NULL
  ORDER BY COALESCE(cp.public_updated_at, cp.updated_at) DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 250), 1), 250);
$$;

REVOKE ALL ON FUNCTION public.list_public_beta_contributor_sitemap(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributor_sitemap(INTEGER) TO service_role;

COMMENT ON FUNCTION public.list_public_beta_contributor_sitemap(INTEGER) IS
  'Liste technique des URLs individuelles toujours consenties pour le sitemap dynamique ; réservée à la fonction serveur.';

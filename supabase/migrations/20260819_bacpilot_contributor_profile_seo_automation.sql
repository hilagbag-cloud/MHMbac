-- BacPilot — automatisation SEO des fiches contributeurs volontaires.
-- Une fiche peut rester publiquement partageable sans être ajoutée à l'index,
-- mais le sitemap et les réponses indexables ne concernent que les profils utiles.

CREATE OR REPLACE FUNCTION public.is_beta_contributor_profile_seo_ready(
  p_publication_status TEXT,
  p_public_name TEXT,
  p_public_bio TEXT,
  p_focus_areas TEXT[],
  p_profile_consent_at TIMESTAMPTZ,
  p_search_indexing_consent_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    p_publication_status = 'published_profile'
    AND p_profile_consent_at IS NOT NULL
    AND p_search_indexing_consent_at IS NOT NULL
    AND char_length(trim(COALESCE(p_public_name, ''))) BETWEEN 2 AND 80
    AND char_length(trim(COALESCE(p_public_bio, ''))) BETWEEN 140 AND 420
    AND cardinality(COALESCE(p_focus_areas, ARRAY[]::TEXT[])) BETWEEN 1 AND 3
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p_focus_areas, ARRAY[]::TEXT[])) AS area
      WHERE char_length(trim(COALESCE(area, ''))) < 2
    );
$$;

REVOKE ALL ON FUNCTION public.is_beta_contributor_profile_seo_ready(TEXT, TEXT, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_beta_contributor_profile_seo_ready(TEXT, TEXT, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Seules les fiches solides et toujours consenties entrent dans le sitemap des profils.
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
    AND cp.public_slug IS NOT NULL
    AND public.is_beta_contributor_profile_seo_ready(
      cp.publication_status,
      cp.public_name,
      cp.public_bio,
      cp.focus_areas,
      cp.profile_consent_at,
      cp.search_indexing_consent_at
    )
  ORDER BY COALESCE(cp.public_updated_at, cp.updated_at) DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 250), 1), 250);
$$;

REVOKE ALL ON FUNCTION public.list_public_beta_contributor_sitemap(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributor_sitemap(INTEGER) TO service_role;

-- Cette liste alimente la version HTML serveur de l'annuaire ; elle exclut les
-- fiches publiques qui n'ont pas encore atteint le niveau de contenu requis.
CREATE OR REPLACE FUNCTION public.list_public_beta_contributor_seo_directory(p_limit INTEGER DEFAULT 120)
RETURNS TABLE (
  public_slug TEXT,
  public_name TEXT,
  public_bio TEXT,
  focus_areas TEXT[],
  contribution_level TEXT,
  public_updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile AS (
    SELECT cp.*
    FROM public.beta_contributor_profiles cp
    JOIN public.beta_testers bt ON bt.user_id = cp.user_id
    WHERE bt.status = 'active'
      AND cp.public_slug IS NOT NULL
      AND public.is_beta_contributor_profile_seo_ready(
        cp.publication_status,
        cp.public_name,
        cp.public_bio,
        cp.focus_areas,
        cp.profile_consent_at,
        cp.search_indexing_consent_at
      )
  ),
  activity_counts AS (
    SELECT p.user_id, LEAST(COUNT(DISTINCT concat_ws('|', e.event_type, COALESCE(e.zone, ''), COALESCE(e.route, ''))), 5)::INTEGER AS action_count
    FROM profile p
    LEFT JOIN public.beta_test_events e ON e.user_id = p.user_id
    GROUP BY p.user_id
  ),
  feedback_counts AS (
    SELECT p.user_id,
      LEAST(COUNT(f.id), 3)::INTEGER AS submitted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status IN ('triaged', 'in_progress', 'resolved')), 3)::INTEGER AS accepted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status = 'resolved'), 3)::INTEGER AS resolved_count
    FROM profile p
    LEFT JOIN public.beta_feedback f ON f.user_id = p.user_id
    GROUP BY p.user_id
  )
  SELECT
    p.public_slug,
    p.public_name,
    p.public_bio,
    p.focus_areas,
    CASE
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 80 THEN 'Pionnier bêta'
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 50 THEN 'Contributeur actif'
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 20 THEN 'Explorateur engagé'
      ELSE 'Découvreur bêta'
    END,
    COALESCE(p.public_updated_at, p.updated_at)
  FROM profile p
  JOIN activity_counts ac ON ac.user_id = p.user_id
  JOIN feedback_counts fc ON fc.user_id = p.user_id
  ORDER BY COALESCE(p.public_updated_at, p.updated_at) DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 120), 1), 120);
$$;

REVOKE ALL ON FUNCTION public.list_public_beta_contributor_seo_directory(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributor_seo_directory(INTEGER) TO service_role;

-- Le profil public expose un indicateur qualitatif, fondé sur des activités réelles,
-- et la condition de qualité que le rendu Vercel utilisera pour index/noindex.
DROP FUNCTION IF EXISTS public.get_public_beta_contributor_by_slug(TEXT);
CREATE FUNCTION public.get_public_beta_contributor_by_slug(p_slug TEXT)
RETURNS TABLE (
  public_slug TEXT,
  public_name TEXT,
  public_bio TEXT,
  focus_areas TEXT[],
  photo_path TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  contribution_level TEXT,
  contribution_highlight TEXT,
  seo_eligible BOOLEAN,
  published_at TIMESTAMPTZ,
  public_updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile AS (
    SELECT cp.*
    FROM public.beta_contributor_profiles cp
    JOIN public.beta_testers bt ON bt.user_id = cp.user_id
    WHERE bt.status = 'active'
      AND cp.publication_status = 'published_profile'
      AND lower(cp.public_slug) = lower(trim(p_slug))
      AND cp.profile_consent_at IS NOT NULL
      AND cp.search_indexing_consent_at IS NOT NULL
    LIMIT 1
  ),
  activity_counts AS (
    SELECT p.user_id, LEAST(COUNT(DISTINCT concat_ws('|', e.event_type, COALESCE(e.zone, ''), COALESCE(e.route, ''))), 5)::INTEGER AS action_count
    FROM profile p
    LEFT JOIN public.beta_test_events e ON e.user_id = p.user_id
    GROUP BY p.user_id
  ),
  feedback_counts AS (
    SELECT p.user_id,
      LEAST(COUNT(f.id), 3)::INTEGER AS submitted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status IN ('triaged', 'in_progress', 'resolved')), 3)::INTEGER AS accepted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status = 'resolved'), 3)::INTEGER AS resolved_count
    FROM profile p
    LEFT JOIN public.beta_feedback f ON f.user_id = p.user_id
    GROUP BY p.user_id
  )
  SELECT
    p.public_slug,
    p.public_name,
    p.public_bio,
    p.focus_areas,
    CASE WHEN p.photo_consent_at IS NOT NULL THEN p.photo_path ELSE NULL END,
    p.portfolio_url,
    p.linkedin_url,
    CASE
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 80 THEN 'Pionnier bêta'
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 50 THEN 'Contributeur actif'
      WHEN LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100) >= 20 THEN 'Explorateur engagé'
      ELSE 'Découvreur bêta'
    END,
    CASE
      WHEN fc.resolved_count > 0 THEN 'A aidé à signaler des améliorations suivies puis résolues par BacPilot.'
      WHEN fc.accepted_count > 0 THEN 'Partage des retours utiles étudiés par l’équipe BacPilot.'
      WHEN fc.submitted_count > 0 THEN 'Contribue avec des retours concrets pour améliorer BacPilot.'
      WHEN ac.action_count > 0 THEN 'Participe activement aux tests de parcours BacPilot.'
      ELSE 'Découvre et teste volontairement les parcours BacPilot.'
    END,
    public.is_beta_contributor_profile_seo_ready(
      p.publication_status,
      p.public_name,
      p.public_bio,
      p.focus_areas,
      p.profile_consent_at,
      p.search_indexing_consent_at
    ),
    p.published_at,
    p.public_updated_at
  FROM profile p
  JOIN activity_counts ac ON ac.user_id = p.user_id
  JOIN feedback_counts fc ON fc.user_id = p.user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_beta_contributor_by_slug(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_beta_contributor_by_slug(TEXT) TO service_role;

COMMENT ON FUNCTION public.is_beta_contributor_profile_seo_ready(TEXT, TEXT, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Détermine si une fiche volontaire est suffisamment complète pour être indexable et incluse au sitemap BacPilot.';
COMMENT ON FUNCTION public.list_public_beta_contributor_seo_directory(INTEGER) IS
  'Exposition serveur des liens HTML vers les seules fiches individuelles prêtes pour l’indexation.';

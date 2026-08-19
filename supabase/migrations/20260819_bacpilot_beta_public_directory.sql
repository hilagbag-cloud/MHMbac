-- BacPilot — annuaire public des contributeurs bêta consentants.
-- Cette procédure est la seule source de données publiques : elle exclut les profils privés,
-- les comptes bêta non actifs et toute personne sans consentement d’indexation explicite.

CREATE INDEX IF NOT EXISTS beta_contributor_profiles_public_directory_idx
  ON public.beta_contributor_profiles (visibility_level, updated_at DESC)
  WHERE profile_consent_at IS NOT NULL AND search_indexing_consent_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.list_public_beta_contributors(p_limit INTEGER DEFAULT 24)
RETURNS TABLE (
  public_name TEXT,
  public_bio TEXT,
  focus_areas TEXT[],
  photo_path TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  contribution_score INTEGER,
  contribution_level TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH visible_profiles AS (
    SELECT cp.*
    FROM public.beta_contributor_profiles cp
    JOIN public.beta_testers bt ON bt.user_id = cp.user_id
    WHERE bt.status = 'active'
      AND cp.visibility_level IN ('name_only', 'profile')
      AND cp.profile_consent_at IS NOT NULL
      AND cp.search_indexing_consent_at IS NOT NULL
  ),
  activity_counts AS (
    SELECT
      vp.user_id,
      LEAST(COUNT(DISTINCT concat_ws('|', e.event_type, COALESCE(e.zone, ''), COALESCE(e.route, ''))), 5)::INTEGER AS action_count
    FROM visible_profiles vp
    LEFT JOIN public.beta_test_events e ON e.user_id = vp.user_id
    GROUP BY vp.user_id
  ),
  feedback_counts AS (
    SELECT
      vp.user_id,
      LEAST(COUNT(f.id), 3)::INTEGER AS submitted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status IN ('triaged', 'in_progress', 'resolved')), 3)::INTEGER AS accepted_count,
      LEAST(COUNT(f.id) FILTER (WHERE f.status = 'resolved'), 3)::INTEGER AS resolved_count
    FROM visible_profiles vp
    LEFT JOIN public.beta_feedback f ON f.user_id = vp.user_id
    GROUP BY vp.user_id
  ),
  ranked AS (
    SELECT
      vp.*,
      LEAST(
        ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5,
        100
      )::INTEGER AS total_score
    FROM visible_profiles vp
    JOIN activity_counts ac ON ac.user_id = vp.user_id
    JOIN feedback_counts fc ON fc.user_id = vp.user_id
  )
  SELECT
    r.public_name,
    CASE WHEN r.visibility_level = 'profile' THEN r.public_bio ELSE NULL END AS public_bio,
    CASE WHEN r.visibility_level = 'profile' THEN r.focus_areas ELSE ARRAY[]::TEXT[] END AS focus_areas,
    CASE WHEN r.visibility_level = 'profile' AND r.photo_consent_at IS NOT NULL THEN r.photo_path ELSE NULL END AS photo_path,
    CASE WHEN r.visibility_level = 'profile' THEN r.portfolio_url ELSE NULL END AS portfolio_url,
    CASE WHEN r.visibility_level = 'profile' THEN r.linkedin_url ELSE NULL END AS linkedin_url,
    r.total_score AS contribution_score,
    CASE
      WHEN r.total_score >= 80 THEN 'Pionnier bêta'
      WHEN r.total_score >= 50 THEN 'Contributeur actif'
      WHEN r.total_score >= 20 THEN 'Explorateur engagé'
      ELSE 'Découvreur bêta'
    END AS contribution_level
  FROM ranked r
  ORDER BY r.total_score DESC, r.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 24);
$$;

REVOKE ALL ON FUNCTION public.list_public_beta_contributors(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributors(INTEGER) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.list_public_beta_contributors(INTEGER) IS
  'Annuaire public borné des bêta-testeurs actifs ayant explicitement accepté la publication et l’indexation de leur profil contributeur.';

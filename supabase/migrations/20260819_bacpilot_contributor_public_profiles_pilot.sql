-- BacPilot — pilote de profils individuels volontaires et indexables.
-- Aucune donnée académique, e-mail, retour privé ou identifiant technique n'est diffusé.

ALTER TABLE public.beta_contributor_profiles
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT NOT NULL DEFAULT 'beta_contributor_public_v1',
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'beta_contributor_publication_status'
      AND conrelid = 'public.beta_contributor_profiles'::regclass
  ) THEN
    ALTER TABLE public.beta_contributor_profiles
      ADD CONSTRAINT beta_contributor_publication_status
      CHECK (publication_status IN ('draft', 'private', 'published_name', 'published_profile', 'withdrawn'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'beta_contributor_public_slug_format'
      AND conrelid = 'public.beta_contributor_profiles'::regclass
  ) THEN
    ALTER TABLE public.beta_contributor_profiles
      ADD CONSTRAINT beta_contributor_public_slug_format
      CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END;
$$;

-- Les profils historiques restent disponibles dans l'annuaire uniquement si leurs
-- consentements existants le permettaient déjà. Ils ne reçoivent jamais une fiche individuelle
-- sans une nouvelle publication active de leur auteur.
UPDATE public.beta_contributor_profiles
SET publication_status = CASE
  WHEN visibility_level IN ('name_only', 'profile')
    AND profile_consent_at IS NOT NULL
    AND search_indexing_consent_at IS NOT NULL
    THEN 'published_name'
  ELSE 'draft'
END,
public_updated_at = CASE
  WHEN visibility_level IN ('name_only', 'profile')
    AND profile_consent_at IS NOT NULL
    AND search_indexing_consent_at IS NOT NULL
    THEN COALESCE(public_updated_at, updated_at)
  ELSE public_updated_at
END
WHERE publication_status = 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS beta_contributor_profiles_public_slug_unique
  ON public.beta_contributor_profiles (lower(public_slug))
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS beta_contributor_profiles_public_profile_lookup
  ON public.beta_contributor_profiles (lower(public_slug), publication_status)
  WHERE publication_status = 'published_profile';

CREATE OR REPLACE FUNCTION public.beta_contributor_profiles_guard_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_active_beta BOOLEAN;
  previous_public BOOLEAN := COALESCE(OLD.publication_status = 'published_profile', FALSE);
BEGIN
  NEW.public_slug := NULLIF(lower(trim(COALESCE(NEW.public_slug, ''))), '');
  NEW.public_bio := NULLIF(trim(COALESCE(NEW.public_bio, '')), '');
  NEW.public_name := NULLIF(trim(COALESCE(NEW.public_name, '')), '');

  SELECT EXISTS (
    SELECT 1 FROM public.beta_testers bt
    WHERE bt.user_id = NEW.user_id AND bt.status = 'active'
  ) INTO is_active_beta;

  IF NEW.publication_status = 'published_name' THEN
    IF NOT is_active_beta OR NEW.public_name IS NULL
      OR NEW.profile_consent_at IS NULL OR NEW.search_indexing_consent_at IS NULL THEN
      RAISE EXCEPTION 'La publication nécessite un compte bêta actif, un nom public et les consentements de profil et d’indexation.';
    END IF;
    NEW.visibility_level := 'name_only';
    NEW.photo_consent_at := NULL;
    NEW.withdrawn_at := NULL;
    NEW.public_updated_at := timezone('utc'::text, now());
  ELSIF NEW.publication_status = 'published_profile' THEN
    IF NOT is_active_beta OR NEW.public_name IS NULL
      OR NEW.profile_consent_at IS NULL OR NEW.search_indexing_consent_at IS NULL THEN
      RAISE EXCEPTION 'La publication nécessite un compte bêta actif, un nom public et les consentements de profil et d’indexation.';
    END IF;
    IF NEW.public_slug IS NULL THEN
      RAISE EXCEPTION 'Un identifiant public est nécessaire pour publier une fiche individuelle.';
    END IF;
    IF NEW.public_bio IS NULL OR char_length(NEW.public_bio) < 60 THEN
      RAISE EXCEPTION 'Une présentation publique d’au moins 60 caractères est nécessaire pour une fiche individuelle.';
    END IF;
    IF previous_public AND NEW.public_slug IS DISTINCT FROM OLD.public_slug THEN
      RAISE EXCEPTION 'Retirez d’abord votre fiche publique avant de modifier son adresse.';
    END IF;
    NEW.visibility_level := 'profile';
    NEW.withdrawn_at := NULL;
    NEW.published_at := CASE
      WHEN previous_public THEN OLD.published_at
      ELSE timezone('utc'::text, now())
    END;
    NEW.public_updated_at := timezone('utc'::text, now());
  ELSIF NEW.publication_status = 'withdrawn' THEN
    NEW.visibility_level := 'private';
    NEW.profile_consent_at := NULL;
    NEW.photo_consent_at := NULL;
    NEW.search_indexing_consent_at := NULL;
    NEW.withdrawn_at := timezone('utc'::text, now());
    NEW.public_updated_at := timezone('utc'::text, now());
  ELSE
    NEW.visibility_level := 'private';
    NEW.profile_consent_at := NULL;
    NEW.photo_consent_at := NULL;
    NEW.search_indexing_consent_at := NULL;
    NEW.public_updated_at := NULL;
    NEW.withdrawn_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.beta_contributor_profiles_guard_publication() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_beta_contributor_profiles_guard_publication ON public.beta_contributor_profiles;
CREATE TRIGGER on_beta_contributor_profiles_guard_publication
  BEFORE INSERT OR UPDATE ON public.beta_contributor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.beta_contributor_profiles_guard_publication();

-- L'annuaire ne liste que les consentements encore actifs, et une fiche complète
-- n'est jamais ajoutée par défaut : l'auteur doit publier explicitement son profil.
DROP FUNCTION IF EXISTS public.list_public_beta_contributors(INTEGER);
CREATE FUNCTION public.list_public_beta_contributors(p_limit INTEGER DEFAULT 24)
RETURNS TABLE (
  public_slug TEXT,
  publication_status TEXT,
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
      AND cp.publication_status IN ('published_name', 'published_profile')
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
      LEAST(ac.action_count * 5 + fc.submitted_count * 10 + fc.accepted_count * 10 + fc.resolved_count * 5, 100)::INTEGER AS total_score
    FROM visible_profiles vp
    JOIN activity_counts ac ON ac.user_id = vp.user_id
    JOIN feedback_counts fc ON fc.user_id = vp.user_id
  )
  SELECT
    CASE WHEN r.publication_status = 'published_profile' THEN r.public_slug ELSE NULL END,
    r.publication_status,
    r.public_name,
    CASE WHEN r.publication_status = 'published_profile' THEN r.public_bio ELSE NULL END,
    CASE WHEN r.publication_status = 'published_profile' THEN r.focus_areas ELSE ARRAY[]::TEXT[] END,
    CASE WHEN r.publication_status = 'published_profile' AND r.photo_consent_at IS NOT NULL THEN r.photo_path ELSE NULL END,
    CASE WHEN r.publication_status = 'published_profile' THEN r.portfolio_url ELSE NULL END,
    CASE WHEN r.publication_status = 'published_profile' THEN r.linkedin_url ELSE NULL END,
    r.total_score,
    CASE
      WHEN r.total_score >= 80 THEN 'Pionnier bêta'
      WHEN r.total_score >= 50 THEN 'Contributeur actif'
      WHEN r.total_score >= 20 THEN 'Explorateur engagé'
      ELSE 'Découvreur bêta'
    END
  FROM ranked r
  ORDER BY r.total_score DESC, r.public_updated_at DESC NULLS LAST, r.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 24);
$$;

REVOKE ALL ON FUNCTION public.list_public_beta_contributors(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributors(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.get_public_beta_contributor_by_slug(p_slug TEXT)
RETURNS TABLE (
  public_slug TEXT,
  public_name TEXT,
  public_bio TEXT,
  focus_areas TEXT[],
  photo_path TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  contribution_level TEXT,
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
    SELECT
      p.user_id,
      LEAST(COUNT(DISTINCT concat_ws('|', e.event_type, COALESCE(e.zone, ''), COALESCE(e.route, ''))), 5)::INTEGER AS action_count
    FROM profile p
    LEFT JOIN public.beta_test_events e ON e.user_id = p.user_id
    GROUP BY p.user_id
  ),
  feedback_counts AS (
    SELECT
      p.user_id,
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
    p.published_at,
    p.public_updated_at
  FROM profile p
  JOIN activity_counts ac ON ac.user_id = p.user_id
  JOIN feedback_counts fc ON fc.user_id = p.user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_beta_contributor_by_slug(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_beta_contributor_by_slug(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_withdrawn_beta_contributor_slug(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.beta_contributor_profiles cp
    WHERE cp.publication_status = 'withdrawn'
      AND lower(cp.public_slug) = lower(trim(p_slug))
  );
$$;

REVOKE ALL ON FUNCTION public.get_withdrawn_beta_contributor_slug(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_withdrawn_beta_contributor_slug(TEXT) TO service_role;

COMMENT ON COLUMN public.beta_contributor_profiles.public_slug IS
  'Identifiant volontaire des fiches publiques individuelles ; jamais dérivé d’un e-mail, UUID ou identifiant candidat.';
COMMENT ON COLUMN public.beta_contributor_profiles.publication_status IS
  'État de diffusion volontaire : l’indexation individuelle exige published_profile et les consentements correspondants.';
COMMENT ON FUNCTION public.get_public_beta_contributor_by_slug(TEXT) IS
  'Expose uniquement les champs consentis d’un profil contributeur publié individuellement.';

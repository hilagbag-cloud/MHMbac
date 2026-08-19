-- BacPilot — attestation complémentaire avant la publication d’une fiche individuelle.
-- Elle ne collecte ni date de naissance ni document d’identité.

ALTER TABLE public.beta_contributor_profiles
  ADD COLUMN IF NOT EXISTS publication_attestation_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.beta_contributor_profiles_require_publication_attestation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.publication_status = 'published_profile'
    AND NEW.publication_attestation_at IS NULL THEN
    RAISE EXCEPTION 'Une attestation de publication est nécessaire avant de créer une fiche individuelle.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.beta_contributor_profiles_require_publication_attestation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aa_beta_contributor_profiles_require_publication_attestation ON public.beta_contributor_profiles;
CREATE TRIGGER aa_beta_contributor_profiles_require_publication_attestation
  BEFORE INSERT OR UPDATE ON public.beta_contributor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.beta_contributor_profiles_require_publication_attestation();

COMMENT ON COLUMN public.beta_contributor_profiles.publication_attestation_at IS
  'Attestation volontaire que le bêta-testeur a l’autorisation nécessaire pour publier sa fiche individuelle ; aucune preuve d’identité n’est stockée.';

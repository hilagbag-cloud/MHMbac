-- BacPilot — transparence des avis : publication automatique des retours consentis.
-- Les contraintes de compte authentifié, un avis par compte, longueur et consentement public restent applicables.
-- Les avis déjà rejetés ne sont jamais republiés automatiquement.

ALTER TABLE public.bacpilot_reviews
  ALTER COLUMN status SET DEFAULT 'published';

DROP POLICY IF EXISTS bacpilot_reviews_owner_insert ON public.bacpilot_reviews;
CREATE POLICY bacpilot_reviews_owner_insert
ON public.bacpilot_reviews
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
  AND status = 'published'
  AND public_consent = true
);

UPDATE public.bacpilot_reviews
SET status = 'published',
    published_at = COALESCE(published_at, created_at, now())
WHERE status = 'pending'
  AND public_consent = true;

CREATE OR REPLACE FUNCTION public.set_bacpilot_review_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bacpilot_reviews_set_published_at ON public.bacpilot_reviews;
CREATE TRIGGER bacpilot_reviews_set_published_at
BEFORE INSERT OR UPDATE OF status ON public.bacpilot_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_bacpilot_review_published_at();

COMMENT ON TABLE public.bacpilot_reviews IS
  'Avis publics BacPilot. Les avis publiés sont soumis par un utilisateur authentifié, avec consentement public, et sont affichés automatiquement.';

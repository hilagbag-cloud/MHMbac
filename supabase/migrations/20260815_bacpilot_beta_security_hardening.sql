-- BacPilot — durcissement du trigger bêta
-- Cette fonction n'est pas une API ; elle ne doit pas être appelable via PostgREST.
REVOKE ALL ON FUNCTION public.beta_feedback_set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.beta_feedback_set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.beta_feedback_set_updated_at() FROM authenticated;

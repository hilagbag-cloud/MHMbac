-- Corrige le contexte RLS du RPC d’orientation.
-- Les candidats n’obtiennent aucun accès direct aux tables guide_programmes ou live_programmes.
ALTER FUNCTION public.get_personalized_recommendations(
  text,
  text,
  text,
  text[],
  text[],
  jsonb,
  numeric,
  integer
) SECURITY DEFINER;

ALTER FUNCTION public.get_personalized_recommendations(
  text,
  text,
  text,
  text[],
  text[],
  jsonb,
  numeric,
  integer
) SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.get_personalized_recommendations(
  text,
  text,
  text,
  text[],
  text[],
  jsonb,
  numeric,
  integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(
  text,
  text,
  text,
  text[],
  text[],
  jsonb,
  numeric,
  integer
) TO authenticated;

COMMENT ON FUNCTION public.get_personalized_recommendations(
  text,
  text,
  text,
  text[],
  text[],
  jsonb,
  numeric,
  integer
) IS 'Sélection interne des pistes officielles pour l’assistant BacPilot ; les tables source restent privées.';

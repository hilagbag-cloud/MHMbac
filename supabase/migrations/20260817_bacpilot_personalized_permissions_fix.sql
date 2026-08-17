-- Allow the personalized scorer to read the protected guide catalogue through its
-- existing SECURITY DEFINER boundary. No table grant is exposed to clients.
ALTER FUNCTION public.get_personalized_recommendations(text, text, text, text[], text[], jsonb, numeric, integer)
  SECURITY DEFINER;

ALTER FUNCTION public.get_personalized_recommendations(text, text, text, text[], text[], jsonb, numeric, integer)
  SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.get_personalized_recommendations(text, text, text, text[], text[], jsonb, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendATIONS(text, text, text, text[], text[], jsonb, numeric, integer) TO authenticated;

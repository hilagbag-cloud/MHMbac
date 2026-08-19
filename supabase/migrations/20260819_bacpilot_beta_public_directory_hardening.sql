-- BacPilot — durcissement de l’annuaire public des contributeurs.
-- La procédure reste réservée au serveur ; la fonction Edge publique applique le seul contrat de lecture prévu.

REVOKE ALL ON FUNCTION public.list_public_beta_contributors(INTEGER) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_beta_contributors(INTEGER) TO service_role;

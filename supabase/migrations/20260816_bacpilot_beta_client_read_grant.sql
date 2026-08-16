-- BacPilot — lecture du statut bêta par le compte concerné.
-- La politique RLS beta_testers_select_own limite déjà chaque ligne à auth.uid() = user_id.
-- Ce droit SQL est nécessaire en complément de RLS pour que le navigateur puisse lire son propre statut.

GRANT SELECT ON TABLE public.beta_testers TO authenticated;

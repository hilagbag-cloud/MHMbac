-- BacPilot — accès interne de la fonction d’ingestion aux reçus idempotents.
-- RLS reste activée et aucun rôle navigateur n’obtient de droit.
GRANT SELECT, INSERT, UPDATE ON TABLE public.sync_batch_receipts TO service_role;

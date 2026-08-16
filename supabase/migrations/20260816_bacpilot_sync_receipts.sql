-- BacPilot — reçus de synchronisation et alertes idempotentes
-- Chaque batch accepté est mémorisé par l’Edge Function afin qu’une reprise
-- après perte de réponse réseau puisse obtenir le même accusé sans réécrire les données.

CREATE TABLE IF NOT EXISTS public.sync_batch_receipts (
  batch_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  collection_id TEXT,
  part INTEGER,
  total_parts INTEGER,
  item_count INTEGER NOT NULL CHECK (item_count > 0 AND item_count <= 500),
  source TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  result JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS sync_batch_receipts_collection_idx
  ON public.sync_batch_receipts (collection_id, received_at DESC);

ALTER TABLE public.sync_batch_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sync_batch_receipts FROM anon, authenticated;

ALTER TABLE public.gauge_alerts ADD COLUMN IF NOT EXISTS event_hash TEXT;
DROP INDEX IF EXISTS public.gauge_alerts_event_hash_unique;
ALTER TABLE public.gauge_alerts DROP CONSTRAINT IF EXISTS gauge_alerts_event_hash_key;
ALTER TABLE public.gauge_alerts
  ADD CONSTRAINT gauge_alerts_event_hash_key UNIQUE (event_hash);

COMMENT ON TABLE public.sync_batch_receipts IS
  'Journal serveur des lots extension BacPilot confirmés. Écriture service_role uniquement.';
COMMENT ON COLUMN public.gauge_alerts.event_hash IS
  'Empreinte déterministe d’un changement afin d’éviter les alertes dupliquées lors des reprises.';

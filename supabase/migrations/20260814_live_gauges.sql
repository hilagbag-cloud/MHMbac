-- MHM SOLUTIONS — données d’orientation en direct
-- Créateur : Hilarus GBAGOULE

CREATE TABLE IF NOT EXISTS public.live_programmes (
  id BIGSERIAL PRIMARY KEY,
  university_id BIGINT NOT NULL,
  university TEXT NOT NULL,
  school_id BIGINT NOT NULL,
  school TEXT NOT NULL,
  programme_id BIGINT NOT NULL,
  programme TEXT NOT NULL,
  scholarships INTEGER NOT NULL DEFAULT 0 CHECK (scholarships >= 0),
  aid INTEGER NOT NULL DEFAULT 0 CHECK (aid >= 0),
  tb INTEGER NOT NULL DEFAULT 0 CHECK (tb >= 0),
  b INTEGER NOT NULL DEFAULT 0 CHECK (b >= 0),
  ab INTEGER NOT NULL DEFAULT 0 CHECK (ab >= 0),
  passable INTEGER NOT NULL DEFAULT 0 CHECK (passable >= 0),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  observed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'chrome_extension',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (programme_id)
);

CREATE TABLE IF NOT EXISTS public.gauge_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id BIGINT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'chrome_extension',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (programme_id, snapshot_hash)
);

CREATE TABLE IF NOT EXISTS public.gauge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id BIGINT NOT NULL,
  programme TEXT NOT NULL,
  university TEXT NOT NULL,
  school TEXT NOT NULL,
  field_name TEXT NOT NULL CHECK (field_name IN ('scholarships','aid','tb','b','ab','passable','total')),
  before_value INTEGER NOT NULL,
  after_value INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS rank INTEGER CHECK (rank IS NULL OR rank >= 0);
ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0);
ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS applicants INTEGER CHECK (applicants IS NULL OR applicants >= 0);
ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS score_version TEXT;
ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS score_opportunity INTEGER CHECK (score_opportunity IS NULL OR score_opportunity BETWEEN 0 AND 100);
ALTER TABLE public.live_programmes ADD COLUMN IF NOT EXISTS score_confidence TEXT;

CREATE INDEX IF NOT EXISTS live_programmes_updated_at_idx ON public.live_programmes (updated_at DESC);
CREATE INDEX IF NOT EXISTS gauge_alerts_created_at_idx ON public.gauge_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS gauge_observations_observed_at_idx ON public.gauge_observations (observed_at DESC);

ALTER TABLE public.live_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gauge_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gauge_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS live_programmes_read_public ON public.live_programmes;
CREATE POLICY live_programmes_read_public ON public.live_programmes FOR SELECT USING (true);

DROP POLICY IF EXISTS gauge_alerts_read_public ON public.gauge_alerts;
CREATE POLICY gauge_alerts_read_public ON public.gauge_alerts FOR SELECT USING (true);

-- Les écritures passent exclusivement par la fonction Edge avec la clé service_role.
REVOKE INSERT, UPDATE, DELETE ON public.live_programmes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.gauge_observations FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.gauge_alerts FROM anon, authenticated;
GRANT SELECT ON public.live_programmes, public.gauge_alerts TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_live_programme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS live_programmes_touch_updated_at ON public.live_programmes;
CREATE TRIGGER live_programmes_touch_updated_at
BEFORE UPDATE ON public.live_programmes
FOR EACH ROW EXECUTE FUNCTION public.touch_live_programme();

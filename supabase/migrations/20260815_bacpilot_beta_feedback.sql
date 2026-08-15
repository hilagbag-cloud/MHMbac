-- BacPilot — dispositif bêta-testeur
-- L'enrôlement est réservé à l'opérateur/service role. Les bêta-testeurs ne
-- peuvent lire et créer que leurs propres retours et événements.

CREATE TABLE IF NOT EXISTS public.beta_testers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'paused', 'revoked')),
  cohort TEXT NOT NULL DEFAULT 'general-beta',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'confusion', 'idea', 'praise')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'blocker')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  expected_behavior TEXT CHECK (expected_behavior IS NULL OR char_length(expected_behavior) <= 2000),
  actual_behavior TEXT CHECK (actual_behavior IS NULL OR char_length(actual_behavior) <= 2000),
  zone TEXT NOT NULL DEFAULT 'autre' CHECK (zone IN ('accueil', 'onboarding', 'dashboard', 'profil', 'extension', 'authentification', 'autre')),
  route TEXT,
  screenshot_path TEXT,
  user_agent TEXT,
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'in_progress', 'resolved', 'duplicate', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.beta_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('route_view', 'feature_tested', 'feedback_submitted', 'search_used', 'recommendation_viewed')),
  zone TEXT,
  route TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_test_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_testers_select_own" ON public.beta_testers;
CREATE POLICY "beta_testers_select_own" ON public.beta_testers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_feedback_select_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_select_own" ON public.beta_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_feedback_insert_own" ON public.beta_feedback;
CREATE POLICY "beta_feedback_insert_own" ON public.beta_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid() AND bt.status = 'active'
    )
  );

DROP POLICY IF EXISTS "beta_test_events_select_own" ON public.beta_test_events;
CREATE POLICY "beta_test_events_select_own" ON public.beta_test_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_test_events_insert_own" ON public.beta_test_events;
CREATE POLICY "beta_test_events_insert_own" ON public.beta_test_events
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid() AND bt.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS beta_feedback_user_created_idx ON public.beta_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS beta_test_events_user_occurred_idx ON public.beta_test_events(user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.beta_feedback_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_beta_feedback_updated ON public.beta_feedback;
CREATE TRIGGER on_beta_feedback_updated
  BEFORE UPDATE ON public.beta_feedback
  FOR EACH ROW EXECUTE FUNCTION public.beta_feedback_set_updated_at();

-- Bucket privé. Les politiques permettent à un bêta-testeur actif d'écrire et
-- lire uniquement dans son propre préfixe user_id/.
INSERT INTO storage.buckets (id, name, public)
VALUES ('beta-feedback', 'beta-feedback', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "beta_feedback_objects_insert_own" ON storage.objects;
CREATE POLICY "beta_feedback_objects_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'beta-feedback'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.beta_testers bt
      WHERE bt.user_id = auth.uid() AND bt.status = 'active'
    )
  );

DROP POLICY IF EXISTS "beta_feedback_objects_select_own" ON storage.objects;
CREATE POLICY "beta_feedback_objects_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'beta-feedback'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

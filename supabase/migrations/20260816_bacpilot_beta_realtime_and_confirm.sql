-- BacPilot — confirmation Telegram simplifiée et synchronisation bêta temps réel.
-- Le statut reste administré par l'opérateur ; l'utilisateur peut uniquement quitter lui-même la bêta.

ALTER TABLE public.operator_input_sessions
  ADD COLUMN IF NOT EXISTS pending_action_id UUID REFERENCES public.operator_pending_actions(id) ON DELETE CASCADE;

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_expected_input_check;

ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_expected_input_check
  CHECK (expected_input IN ('user_identifier', 'beta_user_identifier', 'confirmation_ack'));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_origin_command_check;

ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_origin_command_check
  CHECK (origin_command IN ('/user', '/beta_add', '/beta_pause', '/beta_revoke', '/confirm'));

ALTER TABLE public.operator_input_sessions
  DROP CONSTRAINT IF EXISTS operator_input_sessions_confirmation_target_check;

ALTER TABLE public.operator_input_sessions
  ADD CONSTRAINT operator_input_sessions_confirmation_target_check
  CHECK ((expected_input = 'confirmation_ack' AND pending_action_id IS NOT NULL) OR expected_input <> 'confirmation_ack');

CREATE OR REPLACE FUNCTION public.leave_beta_program()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  updated_status TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise.';
  END IF;

  UPDATE public.beta_testers
  SET status = 'revoked', updated_at = timezone('utc', now())
  WHERE user_id = current_user_id
    AND status IN ('invited', 'active', 'paused')
  RETURNING status INTO updated_status;

  RETURN jsonb_build_object(
    'changed', updated_status IS NOT NULL,
    'status', COALESCE(updated_status, 'revoked')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.leave_beta_program() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_beta_program() TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'beta_testers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beta_testers;
  END IF;
END;
$$;

-- BacPilot — droits minimaux du rôle serveur pour la console Telegram
-- Le rôle service_role est utilisé uniquement dans l’Edge Function protégée par Telegram.
-- Aucun droit n’est ajouté à anon ou authenticated.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT ON TABLE
  public.profiles,
  public.user_preferences,
  public.user_academic_signals,
  public.beta_testers,
  public.beta_test_events,
  public.beta_feedback,
  public.orientation_sessions,
  public.recommendation_runs,
  public.live_programmes,
  public.gauge_observations
TO service_role;

GRANT INSERT, UPDATE, DELETE, SELECT ON TABLE
  public.operator_input_sessions,
  public.operator_pending_actions,
  public.operator_command_audit
TO service_role;

GRANT INSERT, UPDATE ON TABLE public.beta_testers TO service_role;

COMMENT ON TABLE public.operator_command_audit IS
  'Journal privé des commandes exécutées par la console Telegram opérateur BacPilot.';
COMMENT ON TABLE public.operator_pending_actions IS
  'Actions administratives Telegram en attente de confirmation.';
COMMENT ON TABLE public.operator_input_sessions IS
  'Sessions de saisie Telegram privées, expirant rapidement.';

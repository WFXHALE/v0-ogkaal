-- Phase 1: tables used only by trusted server-side PostgreSQL routes.
-- Browser Supabase roles must not access these tables directly.
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.trades,
  public.trade_accounts,
  public.dashboard_password_resets,
  public.email_verification_tokens,
  public.kyc_verifications,
  public.admin_login_attempts,
  public.admin_security_logs,
  public.admin_settings
FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS admin_lockout_all ON public.admin_login_attempts;
DROP POLICY IF EXISTS admin_seclog_all ON public.admin_security_logs;
DROP POLICY IF EXISTS admin_all_settings ON public.admin_settings;
DROP POLICY IF EXISTS anon_all_dashboard_resets ON public.dashboard_password_resets;
DROP POLICY IF EXISTS anon_all_email_verification_tokens ON public.email_verification_tokens;
DROP POLICY IF EXISTS kyc_anon_insert ON public.kyc_verifications;
DROP POLICY IF EXISTS kyc_anon_select ON public.kyc_verifications;
DROP POLICY IF EXISTS kyc_anon_update ON public.kyc_verifications;

-- Trigger functions use only NEW and pg_catalog functions.
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.update_fcm_token_timestamp() SET search_path = '';

-- dashboard_users and fcm_tokens are intentionally excluded until the
-- production deployment uses the new server-authenticated APIs. Applying
-- their revocations before that rollout would break the current production
-- client, which still uses the anon key for these tables.

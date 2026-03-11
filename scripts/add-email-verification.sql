-- ─────────────────────────────────────────────────────────────────────────────
-- Email verification tokens table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,          -- matches dashboard_users.user_id
  email       text NOT NULL,
  token_hash  text NOT NULL,          -- SHA-256 hash of the raw token
  expires_at  timestamp with time zone NOT NULL,
  used_at     timestamp with time zone,
  resend_count integer NOT NULL DEFAULT 0,
  resend_window_start timestamp with time zone,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast token lookup by email
CREATE INDEX IF NOT EXISTS idx_evt_email   ON public.email_verification_tokens (email);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON public.email_verification_tokens (user_id);

-- RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS anon_all_email_verification_tokens
  ON public.email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Visitor analytics table (lightweight server-side hit recording)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_visitors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  text,                    -- anonymous fingerprint / null for unknown
  session_id  text,                    -- per-session id
  path        text,
  country     text,
  city        text,
  user_agent  text,
  referrer    text,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sv_created_at  ON public.site_visitors (created_at);
CREATE INDEX IF NOT EXISTS idx_sv_visitor_id  ON public.site_visitors (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sv_country     ON public.site_visitors (country);

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS anon_all_site_visitors
  ON public.site_visitors
  FOR ALL
  USING (true)
  WITH CHECK (true);

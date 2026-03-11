-- ─────────────────────────────────────────────────────────────────────────────
-- Email verification tokens table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              text NOT NULL,
  email                text NOT NULL,
  token_hash           text NOT NULL,
  expires_at           timestamp with time zone NOT NULL,
  used_at              timestamp with time zone,
  resend_count         integer NOT NULL DEFAULT 0,
  resend_window_start  timestamp with time zone,
  created_at           timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evt_email   ON public.email_verification_tokens (email);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON public.email_verification_tokens (user_id);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_verification_tokens'
      AND policyname = 'anon_all_email_verification_tokens'
  ) THEN
    CREATE POLICY anon_all_email_verification_tokens
      ON public.email_verification_tokens
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Visitor analytics table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_visitors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  text,
  session_id  text,
  path        text,
  country     text,
  city        text,
  user_agent  text,
  referrer    text,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sv_created_at ON public.site_visitors (created_at);
CREATE INDEX IF NOT EXISTS idx_sv_visitor_id ON public.site_visitors (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sv_country    ON public.site_visitors (country);

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'site_visitors'
      AND policyname = 'anon_all_site_visitors'
  ) THEN
    CREATE POLICY anon_all_site_visitors
      ON public.site_visitors
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

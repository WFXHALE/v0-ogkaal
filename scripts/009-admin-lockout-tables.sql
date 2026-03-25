-- admin_login_attempts: tracks failed key attempts per IP + device fingerprint
-- Progressive lockout: 5 fails → 5min, then +2 → 10min, 30min, 1h, 6h, 12h, 24h, 1wk
-- After a successful login, failed_count resets to 0 for that identifier.

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier      text NOT NULL,          -- IP address (primary key for lookups)
  device_fp       text NOT NULL DEFAULT '', -- browser/UA fingerprint
  failed_count    integer NOT NULL DEFAULT 0,
  locked_until    timestamp with time zone,
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (identifier, device_fp)
);

-- admin_security_logs: immutable audit trail
CREATE TABLE IF NOT EXISTS admin_security_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,   -- 'failed_attempt' | 'lockout' | 'success' | 'reset'
  ip_address  text,
  device_fp   text,
  user_agent  text,
  location    text,
  details     text,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow anon read/write (the API routes use service-role anyway, but RLS
-- must permit anon for the route to work without explicit auth headers).
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_lockout_all ON admin_login_attempts;
CREATE POLICY admin_lockout_all ON admin_login_attempts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE admin_security_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_seclog_all ON admin_security_logs;
CREATE POLICY admin_seclog_all ON admin_security_logs FOR ALL USING (true) WITH CHECK (true);

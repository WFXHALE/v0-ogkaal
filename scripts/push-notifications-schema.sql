-- Push notifications table
-- Supports broadcast (recipient_id = 'all') and targeted (specific user id)
CREATE TABLE IF NOT EXISTS push_notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text        NOT NULL,  -- announcement|mentorship|discount|kyc|usdt_p2p|community|trading_alert
  title        text        NOT NULL,
  body         text        NOT NULL,
  data         jsonb       DEFAULT '{}',
  recipient_id text        NOT NULL,  -- user UUID, or 'all' for broadcast
  read         boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pn_recipient ON push_notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pn_type      ON push_notifications (type, created_at DESC);

-- RLS: anon full access (same pattern as rest of app)
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_notifications' AND policyname = 'anon_all_push'
  ) THEN
    CREATE POLICY anon_all_push ON push_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add notification_settings JSONB column to dashboard_users
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS notification_settings jsonb NOT NULL DEFAULT '{
    "announcements":  true,
    "mentorship":     true,
    "discounts":      true,
    "kyc":            true,
    "usdt_p2p":       true,
    "community":      true,
    "trading_alerts": false
  }'::jsonb;

-- Add push_enabled boolean
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true;

-- Push notifications table: stores all outbound notifications
-- Supports both broadcast (recipient_id IS NULL) and targeted (recipient_id set)
CREATE TABLE IF NOT EXISTS push_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,       -- announcement|mentorship|discount|kyc|usdt_p2p|community|trading_alert
  category      text NOT NULL,       -- maps to user preference key
  title         text NOT NULL,
  body          text NOT NULL,
  icon          text,
  url           text,                -- deep-link on click
  data          jsonb DEFAULT '{}',  -- extra payload (order_id, post_id, etc.)
  recipient_id  text,                -- NULL = broadcast to all
  sent_by       text NOT NULL DEFAULT 'system',
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pn_recipient ON push_notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pn_type      ON push_notifications (type, created_at DESC);

-- RLS: anon full access (same pattern as rest of app)
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='push_notifications' AND policyname='anon_all_push'
  ) THEN
    CREATE POLICY anon_all_push ON push_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add notification_settings JSONB column to dashboard_users
-- Stores per-category opt-in: { announcement: true, mentorship: true, ... }
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS notification_settings jsonb NOT NULL DEFAULT '{
    "announcement": true,
    "mentorship": true,
    "discount": true,
    "kyc": true,
    "usdt_p2p": true,
    "community": true,
    "trading_alert": false
  }'::jsonb;

-- Add push_enabled boolean column
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false;

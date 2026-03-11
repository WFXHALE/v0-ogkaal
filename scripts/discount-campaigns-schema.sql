-- Discount campaigns table (admin-only creation/editing)
CREATE TABLE IF NOT EXISTS discount_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  description     text NOT NULL DEFAULT '',
  discount_pct    integer NOT NULL DEFAULT 10 CHECK (discount_pct BETWEEN 1 AND 100),
  applies_to      text[]  NOT NULL DEFAULT '{}',   -- e.g. ['vip','mentorship']
  is_active       boolean NOT NULL DEFAULT false,
  start_date      timestamptz,
  expiry_date     timestamptz,
  push_notify     boolean NOT NULL DEFAULT false,
  email_notify    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: enable but open anon access so the Next.js server (anon key) can read
ALTER TABLE discount_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_campaigns ON discount_campaigns;
CREATE POLICY admin_all_campaigns ON discount_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookup by code during checkout
CREATE INDEX IF NOT EXISTS idx_campaigns_code ON discount_campaigns (code);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON discount_campaigns (is_active);

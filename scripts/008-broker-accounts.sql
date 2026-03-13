-- Create broker_account_verifications table
CREATE TABLE IF NOT EXISTS broker_account_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT,
  username        TEXT,
  broker          TEXT NOT NULL,          -- 'xm' | 'exness' | 'vantage' | 'justmarkets'
  trader_id       TEXT NOT NULL,
  screenshot_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_broker_verif_user_id ON broker_account_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_verif_broker  ON broker_account_verifications(broker);
CREATE INDEX IF NOT EXISTS idx_broker_verif_status  ON broker_account_verifications(status);

-- RLS
ALTER TABLE broker_account_verifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated inserts (any logged-in user can submit)
DO $$ BEGIN
  CREATE POLICY "anon_insert_broker_verif" ON broker_account_verifications
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only service role can read/update/delete (admin panel uses POSTGRES_URL_NON_POOLING)
DO $$ BEGIN
  CREATE POLICY "service_all_broker_verif" ON broker_account_verifications
    FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

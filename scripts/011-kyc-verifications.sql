-- KYC Verifications table
-- Stores full KYC submission data separate from dashboard_users
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL,          -- dashboard_users.user_id
  db_user_id        text NOT NULL,          -- dashboard_users.id (uuid as text)
  full_name         text NOT NULL,
  address           text NOT NULL,
  phone             text NOT NULL,
  email             text NOT NULL,
  telegram          text,
  instagram         text,
  -- Document pathnames (Blob private storage paths)
  aadhaar_pathname  text,
  pan_pathname      text,
  selfie_pathname   text,
  -- Status: pending | approved | rejected | banned
  status            text NOT NULL DEFAULT 'pending',
  admin_note        text,
  submitted_at      timestamp with time zone DEFAULT now(),
  reviewed_at       timestamp with time zone
);

-- RLS: allow anon insert + select (service role handles admin operations)
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_anon_insert' AND tablename = 'kyc_verifications') THEN
    CREATE POLICY kyc_anon_insert ON kyc_verifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_anon_select' AND tablename = 'kyc_verifications') THEN
    CREATE POLICY kyc_anon_select ON kyc_verifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kyc_anon_update' AND tablename = 'kyc_verifications') THEN
    CREATE POLICY kyc_anon_update ON kyc_verifications FOR UPDATE USING (true);
  END IF;
END $$;

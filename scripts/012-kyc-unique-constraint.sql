-- Add unique constraint on db_user_id so ON CONFLICT works for upserts
ALTER TABLE kyc_verifications
  ADD COLUMN IF NOT EXISTS db_user_id text,
  ADD COLUMN IF NOT EXISTS selfie_pathname text,
  ADD COLUMN IF NOT EXISTS aadhaar_pathname text,
  ADD COLUMN IF NOT EXISTS pan_pathname text;

-- Create unique index if it doesn't exist already
CREATE UNIQUE INDEX IF NOT EXISTS kyc_verifications_db_user_id_key ON kyc_verifications(db_user_id);

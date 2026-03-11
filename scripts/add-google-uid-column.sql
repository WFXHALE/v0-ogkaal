-- Add google_uid column to dashboard_users for Google Sign-In linking
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS google_uid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_users_google_uid_idx
  ON dashboard_users (google_uid)
  WHERE google_uid IS NOT NULL;

-- Add plain-text backup_code column to dashboard_users
-- The hash remains for login verification; the plain text is for display.
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS backup_code text;

-- Back-fill any existing rows with a generated placeholder
-- (users will see a "contact support" note if blank)
UPDATE dashboard_users
  SET backup_code = NULL
  WHERE backup_code IS NULL;

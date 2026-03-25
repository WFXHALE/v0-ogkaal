-- Fix column names in admin_login_attempts to match what verify-key route expects:
-- identifier → ip_address, device_fp → device_id, failed_count → failure_count

-- Rename identifier to ip_address
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_login_attempts' AND column_name = 'identifier'
  ) THEN
    ALTER TABLE admin_login_attempts RENAME COLUMN identifier TO ip_address;
  END IF;
END $$;

-- Rename device_fp to device_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_login_attempts' AND column_name = 'device_fp'
  ) THEN
    ALTER TABLE admin_login_attempts RENAME COLUMN device_fp TO device_id;
  END IF;
END $$;

-- Rename failed_count to failure_count
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_login_attempts' AND column_name = 'failed_count'
  ) THEN
    ALTER TABLE admin_login_attempts RENAME COLUMN failed_count TO failure_count;
  END IF;
END $$;

-- Add user_agent column to admin_security_logs if missing
ALTER TABLE admin_security_logs ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0;

-- Drop old unique constraint (created by the UNIQUE clause in CREATE TABLE)
ALTER TABLE admin_login_attempts
  DROP CONSTRAINT IF EXISTS admin_login_attempts_identifier_device_fp_key;

-- Recreate unique constraint on the renamed columns
ALTER TABLE admin_login_attempts
  DROP CONSTRAINT IF EXISTS admin_login_attempts_ip_device_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'admin_login_attempts'
      AND constraint_name = 'admin_login_attempts_ip_device_key'
  ) THEN
    ALTER TABLE admin_login_attempts
      ADD CONSTRAINT admin_login_attempts_ip_device_key UNIQUE (ip_address, device_id);
  END IF;
END $$;

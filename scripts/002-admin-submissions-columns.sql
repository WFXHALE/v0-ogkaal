-- Migration 002: Add missing columns to admin_submissions
-- These are optional fields — nullable, so existing rows are unaffected.

ALTER TABLE admin_submissions
  ADD COLUMN IF NOT EXISTS wallet_address  text,
  ADD COLUMN IF NOT EXISTS upi_id          text,
  ADD COLUMN IF NOT EXISTS inr_equivalent  text,
  ADD COLUMN IF NOT EXISTS amount_paid     text,
  ADD COLUMN IF NOT EXISTS telegram        text,
  ADD COLUMN IF NOT EXISTS screenshot_url  text;

-- Also add anon DELETE policy so the admin panel can delete submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_submissions' AND policyname = 'anon_delete_submissions'
  ) THEN
    CREATE POLICY anon_delete_submissions ON admin_submissions FOR DELETE USING (true);
  END IF;
END $$;

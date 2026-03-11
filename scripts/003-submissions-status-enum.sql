-- Add "dismissed" and "deleted" to the admin_submissions status column.
-- The column is currently text — widen any check constraint that exists.

-- Drop existing check constraint if present (name may vary)
DO $$
DECLARE
  conname text;
BEGIN
  SELECT tc.constraint_name INTO conname
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'admin_submissions'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name ILIKE '%status%'
  LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE admin_submissions DROP CONSTRAINT ' || quote_ident(conname);
  END IF;
END;
$$;

-- Re-add with full set of valid statuses
ALTER TABLE admin_submissions
  ADD CONSTRAINT admin_submissions_status_check
  CHECK (status IN ('pending','approved','rejected','completed','dismissed','deleted'));

-- Index for fast status-filtered queries
CREATE INDEX IF NOT EXISTS idx_admin_submissions_status ON admin_submissions (status);

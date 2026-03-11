-- Add numeric UID and trading profile fields to dashboard_users
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS numeric_uid       bigint,
  ADD COLUMN IF NOT EXISTS trading_level     text,
  ADD COLUMN IF NOT EXISTS market_type       text,
  ADD COLUMN IF NOT EXISTS trading_type      text,
  ADD COLUMN IF NOT EXISTS years_experience  text,
  ADD COLUMN IF NOT EXISTS first_name        text,
  ADD COLUMN IF NOT EXISTS last_name         text;

-- Backfill numeric_uid for any existing rows that don't have one
UPDATE dashboard_users
SET numeric_uid = (100000000 + floor(random() * 899999999)::bigint)
WHERE numeric_uid IS NULL;

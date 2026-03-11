-- Add profile columns to dashboard_users
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS avatar_url  text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS username    text;

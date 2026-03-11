-- Add OTP-based password-reset columns to dashboard_users
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS otp_hash              TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts_today    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_attempts_reset_at TIMESTAMPTZ;

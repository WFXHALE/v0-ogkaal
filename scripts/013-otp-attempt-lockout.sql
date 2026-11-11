-- Limit incorrect password-reset OTP attempts per account.
ALTER TABLE public.dashboard_users
  ADD COLUMN IF NOT EXISTS otp_failed_attempts integer NOT NULL DEFAULT 0;

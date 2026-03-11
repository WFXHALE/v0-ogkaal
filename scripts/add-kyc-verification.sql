-- Add KYC / identity verification columns to dashboard_users
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS is_verified       boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS aadhaar_number    text,
  ADD COLUMN IF NOT EXISTS pan_number        text,
  ADD COLUMN IF NOT EXISTS kyc_phone         text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at  timestamp with time zone,
  ADD COLUMN IF NOT EXISTS kyc_status        text     DEFAULT 'unverified';
-- kyc_status values: 'unverified' | 'pending' | 'verified'

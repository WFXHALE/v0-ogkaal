-- Add document URL columns for KYC image uploads
ALTER TABLE dashboard_users
  ADD COLUMN IF NOT EXISTS kyc_doc_aadhaar_front TEXT,
  ADD COLUMN IF NOT EXISTS kyc_doc_aadhaar_back  TEXT,
  ADD COLUMN IF NOT EXISTS kyc_doc_pan            TEXT;

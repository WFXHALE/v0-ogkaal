-- Create admin_settings table for persisting admin profile, pricing, and system config
-- This table uses a single-row key-value pattern keyed on "setting_key"

CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the default rows so they always exist
INSERT INTO admin_settings (key, value)
VALUES
  ('admin_profile', '{"name": "", "phone": ""}'),
  ('system_config', '{
    "upiEnabled": true,
    "cryptoEnabled": true,
    "erupeeEnabled": true,
    "maintenanceMode": false,
    "telegramEnabled": true,
    "notifEnabled": true,
    "paymentInstructions": "Pay via UPI or Crypto and upload screenshot with UTR number."
  }'),
  ('pricing', '{
    "mentorship_1": "₹4,999",
    "mentorship_2": "₹7,999",
    "crypto_mentorship": "₹9,999",
    "vip_signal": "₹2,999",
    "funded_account": "₹14,999",
    "vip_signal_xm_existing": "₹1,999",
    "vip_signal_xm_new": "₹999"
  }'),
  ('notifications_read', '{"read_ids": []}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin panel runs server-side with service role)
CREATE POLICY IF NOT EXISTS admin_all_settings ON admin_settings FOR ALL USING (true) WITH CHECK (true);

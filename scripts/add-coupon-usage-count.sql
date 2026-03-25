-- Add usage_count and fixed_amount columns to discount_campaigns
-- usage_count tracks how many times a coupon has been redeemed
-- discount_type lets admin pick 'percent' or 'fixed'
-- discount_amount is the raw amount for fixed discounts (e.g. 100 = ₹100 off)

ALTER TABLE discount_campaigns
  ADD COLUMN IF NOT EXISTS usage_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses     integer,           -- NULL = unlimited
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  ADD COLUMN IF NOT EXISTS discount_amount numeric;        -- used when discount_type = 'fixed'

-- Seed three example coupons for the admin to see on first launch
INSERT INTO discount_campaigns (code, description, discount_type, discount_pct, discount_amount, applies_to, is_active, expiry_date)
VALUES
  ('NEWYEAR50', 'New Year 50% discount',     'percent', 50,  NULL,  ARRAY['mentorship','vip'], true,  NOW() + interval '90 days'),
  ('VIP30',     'VIP Group 30% off',         'percent', 30,  NULL,  ARRAY['vip'],              true,  NOW() + interval '60 days'),
  ('MENTOR100', '₹100 off any mentorship',   'fixed',    0,   100,  ARRAY['mentorship'],       true,  NOW() + interval '30 days')
ON CONFLICT (code) DO NOTHING;

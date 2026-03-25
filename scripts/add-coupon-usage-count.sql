-- Add usage_count, max_uses, discount_type, discount_amount columns
-- Also relax the discount_pct check so 0 is valid for fixed-amount coupons

ALTER TABLE discount_campaigns
  ADD COLUMN IF NOT EXISTS usage_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses       integer,            -- NULL = unlimited
  ADD COLUMN IF NOT EXISTS discount_type  text NOT NULL DEFAULT 'percent',  -- 'percent' | 'fixed'
  ADD COLUMN IF NOT EXISTS discount_amount numeric;           -- used when discount_type = 'fixed'

-- Relax the check constraint so fixed-amount coupons can have discount_pct = 0
ALTER TABLE discount_campaigns
  DROP CONSTRAINT IF EXISTS discount_campaigns_discount_pct_check;

ALTER TABLE discount_campaigns
  ADD CONSTRAINT discount_campaigns_discount_pct_check
  CHECK (discount_pct BETWEEN 0 AND 100);

-- Seed three example coupons (DO NOTHING if they already exist)
INSERT INTO discount_campaigns (code, description, discount_type, discount_pct, discount_amount, applies_to, is_active, expiry_date)
VALUES
  ('NEWYEAR50', 'New Year 50% discount',    'percent', 50,  NULL, ARRAY['mentorship','vip'], true, NOW() + interval '90 days'),
  ('VIP30',     'VIP Group 30% off',        'percent', 30,  NULL, ARRAY['vip'],              true, NOW() + interval '60 days'),
  ('MENTOR100', '₹100 off any mentorship',  'fixed',    0,  100,  ARRAY['mentorship'],       true, NOW() + interval '30 days')
ON CONFLICT (code) DO NOTHING;

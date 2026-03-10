-- Admin submissions table (payments, memberships, VIP requests)
CREATE TABLE IF NOT EXISTS public.admin_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text,
  type            text NOT NULL,  -- 'vip' | 'vip_group' | 'mentorship' | 'usdt_buy' | 'usdt_sell' | 'other'
  name            text NOT NULL,
  email           text,
  phone           text,
  telegram        text,
  payment_method  text,
  amount          text,
  utr             text,
  screenshot_url  text,
  details         jsonb DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'completed'
  ip_address      text DEFAULT 'Unknown',
  location        text DEFAULT 'Unknown',
  created_at      timestamptz DEFAULT now()
);

-- USDT buy requests (user buying USDT from admin)
CREATE TABLE IF NOT EXISTS public.usdt_buy_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text,
  name            text NOT NULL,
  email           text,
  phone           text,
  wallet_address  text,
  transaction_id  text,
  screenshot_url  text,
  amount_usdt     text,
  inr_equivalent  text,
  amount_paid     text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- USDT sell requests (user selling USDT to admin)
CREATE TABLE IF NOT EXISTS public.usdt_sell_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text,
  name            text NOT NULL,
  email           text,
  phone           text,
  upi_id          text,
  wallet_address  text,
  amount_usdt     text,
  transaction_id  text,
  screenshot_url  text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- Admin notification log
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,  -- 'vip' | 'mentorship' | 'usdt_buy' | 'usdt_sell'
  title       text NOT NULL,
  message     text NOT NULL,
  ref_id      text,           -- submission id
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- RLS: service role only for admin tables
ALTER TABLE public.admin_submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_buy_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_sell_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications    ENABLE ROW LEVEL SECURITY;

-- Allow anon reads/inserts for submissions (users submit, admin reads via service role)
CREATE POLICY "anon_insert_submissions"  ON public.admin_submissions  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_submissions"  ON public.admin_submissions  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_submissions"  ON public.admin_submissions  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_usdt_buy"     ON public.usdt_buy_requests  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_usdt_buy"     ON public.usdt_buy_requests  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_usdt_buy"     ON public.usdt_buy_requests  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_usdt_sell"    ON public.usdt_sell_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_usdt_sell"    ON public.usdt_sell_requests FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_usdt_sell"    ON public.usdt_sell_requests FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_select_admin_notifs" ON public.admin_notifications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_admin_notifs" ON public.admin_notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_admin_notifs" ON public.admin_notifications FOR UPDATE TO anon USING (true);

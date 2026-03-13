-- Safe migration: ensure usdt_buy_requests, usdt_sell_requests, and
-- admin_notifications tables + policies exist. Uses IF NOT EXISTS / DO blocks
-- so it is safe to run multiple times.

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

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  ref_id      text,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.usdt_buy_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_sell_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies — only create if they don't already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_buy_requests' AND policyname = 'anon_insert_usdt_buy'
  ) THEN
    CREATE POLICY "anon_insert_usdt_buy" ON public.usdt_buy_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_buy_requests' AND policyname = 'anon_select_usdt_buy'
  ) THEN
    CREATE POLICY "anon_select_usdt_buy" ON public.usdt_buy_requests FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_buy_requests' AND policyname = 'anon_update_usdt_buy'
  ) THEN
    CREATE POLICY "anon_update_usdt_buy" ON public.usdt_buy_requests FOR UPDATE TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_sell_requests' AND policyname = 'anon_insert_usdt_sell'
  ) THEN
    CREATE POLICY "anon_insert_usdt_sell" ON public.usdt_sell_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_sell_requests' AND policyname = 'anon_select_usdt_sell'
  ) THEN
    CREATE POLICY "anon_select_usdt_sell" ON public.usdt_sell_requests FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_sell_requests' AND policyname = 'anon_update_usdt_sell'
  ) THEN
    CREATE POLICY "anon_update_usdt_sell" ON public.usdt_sell_requests FOR UPDATE TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_notifications' AND policyname = 'anon_select_admin_notifs'
  ) THEN
    CREATE POLICY "anon_select_admin_notifs" ON public.admin_notifications FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_notifications' AND policyname = 'anon_insert_admin_notifs'
  ) THEN
    CREATE POLICY "anon_insert_admin_notifs" ON public.admin_notifications FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_notifications' AND policyname = 'anon_update_admin_notifs'
  ) THEN
    CREATE POLICY "anon_update_admin_notifs" ON public.admin_notifications FOR UPDATE TO anon USING (true);
  END IF;
END $$;

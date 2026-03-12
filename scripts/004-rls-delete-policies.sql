-- Add missing DELETE RLS policies for admin-controlled tables

-- admin_notifications — allow deleting notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_notifications' AND policyname = 'anon_delete_admin_notifs'
  ) THEN
    CREATE POLICY anon_delete_admin_notifs
      ON admin_notifications FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- usdt_buy_requests — allow admin hard-deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_buy_requests' AND policyname = 'anon_delete_usdt_buy'
  ) THEN
    CREATE POLICY anon_delete_usdt_buy
      ON usdt_buy_requests FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- usdt_sell_requests — allow admin hard-deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usdt_sell_requests' AND policyname = 'anon_delete_usdt_sell'
  ) THEN
    CREATE POLICY anon_delete_usdt_sell
      ON usdt_sell_requests FOR DELETE TO anon USING (true);
  END IF;
END $$;

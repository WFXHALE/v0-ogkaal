-- Add notification_status column to all submission tables
-- Default = 'UNREAD', admin marks 'READ' when they view the record.
-- Using IF NOT EXISTS equivalent via DO blocks for idempotency.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_submissions' AND column_name = 'notification_status'
  ) THEN
    ALTER TABLE public.admin_submissions ADD COLUMN notification_status text NOT NULL DEFAULT 'UNREAD';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usdt_buy_requests' AND column_name = 'notification_status'
  ) THEN
    ALTER TABLE public.usdt_buy_requests ADD COLUMN notification_status text NOT NULL DEFAULT 'UNREAD';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usdt_sell_requests' AND column_name = 'notification_status'
  ) THEN
    ALTER TABLE public.usdt_sell_requests ADD COLUMN notification_status text NOT NULL DEFAULT 'UNREAD';
  END IF;
END $$;

-- Backfill existing records as READ (they were seen before this feature existed)
UPDATE public.admin_submissions  SET notification_status = 'READ' WHERE notification_status = 'UNREAD';
UPDATE public.usdt_buy_requests  SET notification_status = 'READ' WHERE notification_status = 'UNREAD';
UPDATE public.usdt_sell_requests SET notification_status = 'READ' WHERE notification_status = 'UNREAD';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

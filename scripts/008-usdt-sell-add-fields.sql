-- Migration: add missing fields to usdt_sell_requests table
-- Safe to run multiple times (IF NOT EXISTS / DO blocks).

ALTER TABLE public.usdt_sell_requests
  ADD COLUMN IF NOT EXISTS upi_name            text,
  ADD COLUMN IF NOT EXISTS telegram            text,
  ADD COLUMN IF NOT EXISTS payment_method_type text,
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'UNREAD';

-- Backfill notification_status for existing rows
UPDATE public.usdt_sell_requests
   SET notification_status = 'READ'
 WHERE notification_status IS NULL;

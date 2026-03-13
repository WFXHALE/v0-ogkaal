-- Add unique constraint on trade_accounts.user_id so ON CONFLICT upsert works
ALTER TABLE trade_accounts
  ADD CONSTRAINT trade_accounts_user_id_key UNIQUE (user_id);

-- trade_accounts: stores account details per user
CREATE TABLE IF NOT EXISTS trade_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL,
  broker              text NOT NULL,
  platform            text NOT NULL,
  balance             numeric(18,2) NOT NULL DEFAULT 0,
  daily_profit_target numeric(18,2),
  daily_max_loss      numeric(18,2),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_accounts_user ON trade_accounts(user_id);

-- trades: open and closed trades
CREATE TABLE IF NOT EXISTS trades (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES trade_accounts(id) ON DELETE CASCADE,
  user_id       text NOT NULL,
  pair          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('buy','sell')),
  lot_size      numeric(10,2) NOT NULL,
  entry_price   numeric(18,5) NOT NULL,
  stop_loss     numeric(18,5) NOT NULL,
  take_profit   numeric(18,5) NOT NULL,
  current_price numeric(18,5),
  exit_price    numeric(18,5),
  profit_loss   numeric(18,2),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opened_at     timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_user    ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status  ON trades(status);

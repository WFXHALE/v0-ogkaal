-- FCM push notification token storage
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,  -- dashboard_users.user_id
  token      text        NOT NULL UNIQUE,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx ON fcm_tokens(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_fcm_token_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER trg_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_fcm_token_timestamp();

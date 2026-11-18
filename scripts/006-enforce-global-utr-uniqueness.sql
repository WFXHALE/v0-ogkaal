-- Enforce one normalized payment reference across admin submissions and USDT P2P.
-- Additive and reversible: dropping the three triggers, function, and registry table
-- removes this protection without changing existing request rows.

CREATE TABLE IF NOT EXISTS public.submitted_utr_registry (
  normalized_utr text PRIMARY KEY,
  source_table text NOT NULL CHECK (
    source_table IN ('admin_submissions', 'usdt_buy_requests', 'usdt_sell_requests')
  ),
  source_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submitted_utr_registry_source_row_unique UNIQUE (source_table, source_id)
);

ALTER TABLE public.submitted_utr_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.submitted_utr_registry FROM PUBLIC, anon, authenticated;

-- Abort rather than silently choosing a winner if legacy duplicates already exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT normalized_utr
    FROM (
      SELECT lower(btrim(utr)) AS normalized_utr
      FROM public.admin_submissions
      WHERE nullif(btrim(utr), '') IS NOT NULL
      UNION ALL
      SELECT lower(btrim(transaction_id))
      FROM public.usdt_buy_requests
      WHERE nullif(btrim(transaction_id), '') IS NOT NULL
      UNION ALL
      SELECT lower(btrim(transaction_id))
      FROM public.usdt_sell_requests
      WHERE nullif(btrim(transaction_id), '') IS NOT NULL
    ) existing_refs
    GROUP BY normalized_utr
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existing duplicate payment references must be reviewed before enabling global UTR uniqueness';
  END IF;
END
$$;

-- Backfill current references before installing the trigger.
INSERT INTO public.submitted_utr_registry (normalized_utr, source_table, source_id)
SELECT lower(btrim(utr)), 'admin_submissions', id::text
FROM public.admin_submissions
WHERE nullif(btrim(utr), '') IS NOT NULL
UNION ALL
SELECT lower(btrim(transaction_id)), 'usdt_buy_requests', id::text
FROM public.usdt_buy_requests
WHERE nullif(btrim(transaction_id), '') IS NOT NULL
UNION ALL
SELECT lower(btrim(transaction_id)), 'usdt_sell_requests', id::text
FROM public.usdt_sell_requests
WHERE nullif(btrim(transaction_id), '') IS NOT NULL
ON CONFLICT (normalized_utr) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reserve_global_payment_utr()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_utr text;
  old_utr text;
  inserted_rows integer;
  existing_table text;
  existing_id text;
BEGIN
  IF TG_TABLE_NAME = 'admin_submissions' THEN
    new_utr := nullif(lower(btrim(NEW.utr)), '');
    IF TG_OP = 'UPDATE' THEN
      old_utr := nullif(lower(btrim(OLD.utr)), '');
    END IF;
  ELSE
    new_utr := nullif(lower(btrim(NEW.transaction_id)), '');
    IF TG_OP = 'UPDATE' THEN
      old_utr := nullif(lower(btrim(OLD.transaction_id)), '');
    END IF;
  END IF;

  IF new_utr IS NULL THEN
    IF TG_OP = 'UPDATE' AND old_utr IS NOT NULL THEN
      DELETE FROM public.submitted_utr_registry
      WHERE normalized_utr = old_utr
        AND source_table = TG_TABLE_NAME
        AND source_id = NEW.id::text;
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.submitted_utr_registry (normalized_utr, source_table, source_id)
  VALUES (new_utr, TG_TABLE_NAME, NEW.id::text)
  ON CONFLICT (normalized_utr) DO NOTHING;

  GET DIAGNOSTICS inserted_rows = ROW_COUNT;

  IF inserted_rows = 0 THEN
    SELECT source_table, source_id
      INTO existing_table, existing_id
    FROM public.submitted_utr_registry
    WHERE normalized_utr = new_utr;

    IF existing_table IS DISTINCT FROM TG_TABLE_NAME
       OR existing_id IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'This payment reference has already been submitted'
        USING ERRCODE = '23505',
              CONSTRAINT = 'submitted_utr_registry_pkey';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND old_utr IS NOT NULL
     AND old_utr <> new_utr THEN
    DELETE FROM public.submitted_utr_registry
    WHERE normalized_utr = old_utr
      AND source_table = TG_TABLE_NAME
      AND source_id = NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_global_payment_utr() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reserve_admin_submission_utr ON public.admin_submissions;
CREATE TRIGGER reserve_admin_submission_utr
BEFORE INSERT OR UPDATE OF utr ON public.admin_submissions
FOR EACH ROW EXECUTE FUNCTION public.reserve_global_payment_utr();

DROP TRIGGER IF EXISTS reserve_usdt_buy_utr ON public.usdt_buy_requests;
CREATE TRIGGER reserve_usdt_buy_utr
BEFORE INSERT OR UPDATE OF transaction_id ON public.usdt_buy_requests
FOR EACH ROW EXECUTE FUNCTION public.reserve_global_payment_utr();

DROP TRIGGER IF EXISTS reserve_usdt_sell_utr ON public.usdt_sell_requests;
CREATE TRIGGER reserve_usdt_sell_utr
BEFORE INSERT OR UPDATE OF transaction_id ON public.usdt_sell_requests
FOR EACH ROW EXECUTE FUNCTION public.reserve_global_payment_utr();

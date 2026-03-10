-- Track when TP/SL levels were last modified.
-- Auto-detection uses this as the reference start date instead of datum_eroeffnung,
-- so that adjusted TP/SL levels are only checked against OHLC data from after the change.
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp_sl_geaendert_am timestamptz;

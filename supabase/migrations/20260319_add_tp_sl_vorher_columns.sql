-- Track previous TP/SL values when levels are adjusted.
-- Only stores the last change — shown as tooltip in active trades table.

ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss_vorher double precision;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp1_vorher double precision;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp2_vorher double precision;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp3_vorher double precision;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp4_vorher double precision;

-- Add per-TP weight distribution columns to trade_setups.
-- Values are stored as percentages (0-100). All active TP weights should sum to 100.
ALTER TABLE trade_setups ADD COLUMN IF NOT EXISTS tp1_gewichtung smallint;
ALTER TABLE trade_setups ADD COLUMN IF NOT EXISTS tp2_gewichtung smallint;
ALTER TABLE trade_setups ADD COLUMN IF NOT EXISTS tp3_gewichtung smallint;
ALTER TABLE trade_setups ADD COLUMN IF NOT EXISTS tp4_gewichtung smallint;

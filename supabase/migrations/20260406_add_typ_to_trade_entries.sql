-- Add `typ` to trade_entries to distinguish Limit vs Stop Buy entries.
--
-- limit: classic pending order — triggers when price reaches the level
--   from "above" (LONG: low <= preis) or "below" (SHORT: high >= preis).
-- stop:  breakout order — triggers when price reaches the level
--   from "below" (LONG: high >= preis) or "above" (SHORT: low <= preis).
--
-- Existing rows are backfilled to 'limit' to preserve current behavior.

ALTER TABLE trade_entries
  ADD COLUMN typ text NOT NULL DEFAULT 'limit'
  CHECK (typ IN ('limit', 'stop'));

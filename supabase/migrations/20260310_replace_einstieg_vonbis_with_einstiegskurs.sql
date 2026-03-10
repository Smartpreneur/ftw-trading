-- Replace einstieg_von / einstieg_bis with a single einstiegskurs column.
-- Migrate data: use einstieg_von as the einstiegskurs value.
ALTER TABLE trade_setups ADD COLUMN IF NOT EXISTS einstiegskurs numeric;
UPDATE trade_setups SET einstiegskurs = einstieg_von WHERE einstiegskurs IS NULL;
ALTER TABLE trade_setups ALTER COLUMN einstiegskurs SET NOT NULL;

-- Make stop_loss nullable (was NOT NULL before)
ALTER TABLE trade_setups ALTER COLUMN stop_loss DROP NOT NULL;

-- Drop old columns
ALTER TABLE trade_setups DROP COLUMN IF EXISTS einstieg_von;
ALTER TABLE trade_setups DROP COLUMN IF EXISTS einstieg_bis;

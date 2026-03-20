-- Add cancellation tracking columns
-- cancellation_type: "Widerruf" (within 37 days) or "Kündigung" (after 37 days)
ALTER TABLE ablefy_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE ablefy_orders ADD COLUMN IF NOT EXISTS cancellation_type text;

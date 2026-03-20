-- Convert is_new_order from boolean to text to preserve raw webhook values
-- (e.g. "TRUE", "Subscription_Cancelled", etc.)

ALTER TABLE ablefy_orders
  ALTER COLUMN is_new_order DROP DEFAULT;

ALTER TABLE ablefy_orders
  ALTER COLUMN is_new_order TYPE text
  USING CASE WHEN is_new_order THEN 'true' ELSE 'false' END;

ALTER TABLE ablefy_orders
  ALTER COLUMN is_new_order SET DEFAULT 'true';

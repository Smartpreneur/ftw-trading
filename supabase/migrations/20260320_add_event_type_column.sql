-- Add event_type column to support separate rows for orders and cancellations
-- PK changes from (order_id) to (order_id, event_type)
ALTER TABLE ablefy_orders ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'order';
ALTER TABLE ablefy_orders DROP CONSTRAINT ablefy_orders_pkey;
ALTER TABLE ablefy_orders ADD PRIMARY KEY (order_id, event_type);

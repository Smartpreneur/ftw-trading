-- Trade entry points: multiple entry levels per trade/setup.
-- Mirrors the trade_closes pattern. When an entry price is reached,
-- erreicht_am is set and the trade's einstiegspreis is recalculated
-- as the weighted average of all triggered entries.

CREATE TABLE IF NOT EXISTS trade_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_fk uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  nummer integer NOT NULL,
  preis double precision NOT NULL,
  anteil double precision NOT NULL,
  datum date,
  erreicht_am timestamptz,
  bemerkungen text,
  created_at timestamptz DEFAULT now()
);

-- Prevent duplicate entry numbers per trade
CREATE UNIQUE INDEX uq_trade_entries_nummer ON trade_entries (trade_fk, nummer);

-- Enable RLS (service_role bypasses)
ALTER TABLE trade_entries ENABLE ROW LEVEL SECURITY;

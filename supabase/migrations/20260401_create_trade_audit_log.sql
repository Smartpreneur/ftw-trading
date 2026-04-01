-- Audit log for trade changes (tracks who changed what, when)
CREATE TABLE IF NOT EXISTS trade_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  trade_nr integer,
  feld text NOT NULL,
  alter_wert text,
  neuer_wert text,
  quelle text DEFAULT 'admin',
  erstellt_am timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_trade ON trade_audit_log(trade_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_zeit ON trade_audit_log(erstellt_am DESC);

-- Allow service role full access
ALTER TABLE trade_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON trade_audit_log FOR ALL USING (true) WITH CHECK (true);

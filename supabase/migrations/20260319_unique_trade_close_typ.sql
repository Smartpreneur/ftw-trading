-- Prevent duplicate trade_close entries for the same trade + typ combination.
-- This guards against race conditions where concurrent requests both check
-- for an existing close, find none, and both insert.
--
-- For TP types (TP1-TP4): only one close per TP level per trade is valid.
-- For SL: only one SL close per trade is valid.
-- For Manuell: multiple manual closes are allowed (excluded from constraint).

CREATE UNIQUE INDEX uq_trade_closes_typ
  ON trade_closes (trade_fk, typ)
  WHERE typ IN ('TP1', 'TP2', 'TP3', 'TP4', 'SL');

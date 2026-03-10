-- Make CRV and zeiteinheit optional in trade_setups
ALTER TABLE trade_setups ALTER COLUMN risiko_reward_min DROP NOT NULL;
ALTER TABLE trade_setups ALTER COLUMN risiko_reward_max DROP NOT NULL;
ALTER TABLE trade_setups ALTER COLUMN zeiteinheit DROP NOT NULL;

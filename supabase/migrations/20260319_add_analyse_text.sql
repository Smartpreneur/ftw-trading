-- Long-form analysis text for trade setups, displayed below chart image in email alerts.
ALTER TABLE trades ADD COLUMN IF NOT EXISTS analyse_text text;

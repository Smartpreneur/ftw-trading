-- Campaign-ID Feld für Rabattcodes: wird an Ablefy als campaign_id weitergereicht
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS campaign_id text;

-- Bestehenden y26-Code mit der bisherigen Campaign-ID befüllen
UPDATE discount_codes SET campaign_id = '20260225-LP2-YTC' WHERE code = 'y26';

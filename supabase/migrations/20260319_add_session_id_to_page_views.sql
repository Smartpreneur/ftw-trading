-- Add session_id to page_views for distinguishing unique sessions from reloads.
-- session_id is a random UUID generated client-side in sessionStorage —
-- no cookies, no personal data, just a per-tab identifier.

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;

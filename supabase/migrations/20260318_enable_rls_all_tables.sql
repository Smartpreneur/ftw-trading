-- ============================================================
-- Tighten RLS policies across all public tables.
-- Server-side code now uses service_role key (bypasses RLS).
-- Only the landing page (client-side, anon key) needs specific policies.
-- ============================================================

-- 1. Enable RLS on ablefy_orders (only table missing it)
ALTER TABLE public.ablefy_orders ENABLE ROW LEVEL SECURITY;

-- 2. DROP all overly permissive policies
-- trades: "Allow all" for anon → anyone can CRUD all trades
DROP POLICY IF EXISTS "Allow all" ON public.trades;

-- trade_closes: "Anon write" ALL + "Public read"
DROP POLICY IF EXISTS "Anon write" ON public.trade_closes;
DROP POLICY IF EXISTS "Public read" ON public.trade_closes;

-- trade_notes: "Anon write" ALL + "Public read"
DROP POLICY IF EXISTS "Anon write" ON public.trade_notes;
DROP POLICY IF EXISTS "Public read" ON public.trade_notes;

-- active_trade_prices: public insert/read/update
DROP POLICY IF EXISTS "Allow public insert access" ON public.active_trade_prices;
DROP POLICY IF EXISTS "Allow public read access" ON public.active_trade_prices;
DROP POLICY IF EXISTS "Allow public update access" ON public.active_trade_prices;

-- discount_codes: "discount_codes_modify" ALL for public (anyone can edit codes!)
DROP POLICY IF EXISTS "discount_codes_modify" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_select" ON public.discount_codes;

-- kanban_tasks: ALL for public
DROP POLICY IF EXISTS "kanban_tasks_all" ON public.kanban_tasks;

-- landing_events: keep anon insert, drop anon read (only admin needs to read)
DROP POLICY IF EXISTS "anon can read events" ON public.landing_events;

-- page_views: anon read not needed (only admin reads)
DROP POLICY IF EXISTS "anon_select" ON public.page_views;

-- umfrage_sessions: anon select/update too permissive
DROP POLICY IF EXISTS "anon_select_sessions" ON public.umfrage_sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON public.umfrage_sessions;

-- 3. CREATE targeted anon policies (only what the landing page browser client needs)

-- Landing page: anyone can read discount codes (ref code / coupon validation)
CREATE POLICY "anon_select_discount_codes"
  ON public.discount_codes
  FOR SELECT
  TO anon
  USING (true);

-- Note: landing_events INSERT and page_views INSERT policies already exist
-- and are correctly scoped (anon INSERT only). No changes needed for those.
-- The "anon can insert events" policy on landing_events is kept.
-- The "anon_insert" policy on page_views is kept.
-- The umfrage insert policies are kept (anon_insert_emails, anon_insert_pageviews, anon_insert_sessions).
-- The "authenticated can read events" on landing_events is kept.

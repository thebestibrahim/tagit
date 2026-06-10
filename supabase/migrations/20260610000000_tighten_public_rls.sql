-- ============================================================
-- Tighten public RLS read policies (CRITICAL security fix)
--
-- Four tables carried `FOR SELECT USING (TRUE)` policies, which grant
-- the public anon key (shipped in the client bundle) unrestricted read
-- of every row directly via the Supabase REST API — bypassing all of
-- our API-route checks.
--
-- Most damaging: `ownership_records` (owner_name, owner_email,
-- backup_email, sale_price) and `transfer_requests` (to_email, to_name,
-- sale_price, acceptance_token) could be dumped wholesale.
--
-- These policies are NOT needed: every public-facing page
-- (/v/[token], /certificate/[id]) already reads through the
-- service-role client server-side, which bypasses RLS. Authenticated
-- brands read their own rows via the `*_company_*` policies, and admins
-- via the `admin_all_*` policies. No client/anon code issues a database
-- read against these tables (verified: the only browser `.from()` calls
-- are storage-bucket uploads).
--
-- Dropping the public-read grants therefore closes the leak with no
-- functional change. Idempotent — safe to re-run.
-- ============================================================

-- ownership_records: pure PII, never needs anon read.
DROP POLICY IF EXISTS "ownership_public_read" ON ownership_records;

-- transfer_requests: exposed acceptance_token + recipient PII.
DROP POLICY IF EXISTS "transfers_public_read_by_token" ON transfer_requests;

-- products: full catalog incl. unshipped products.
DROP POLICY IF EXISTS "products_public_read" ON products;

-- tags: full token -> company map.
DROP POLICY IF EXISTS "tags_public_read_by_token" ON tags;

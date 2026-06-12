-- ============================================================
-- Restore brand read access to transfer_requests (regression fix)
--
-- Same regression as ownership_records: 20260610000000_tighten_public_rls.sql
-- dropped `transfers_public_read_by_token` (closing the anon PII/token leak —
-- correct) but transfer_requests never had a company-scoped SELECT policy to
-- fall back on. Its only remaining policies are admin + service_role.
--
-- Effect: a brand reading transfer_requests through the user-scoped (anon)
-- client with RLS enforced gets ZERO rows. So the Resale Analytics location
-- cards and the product detail "transfer" timeline were always empty even when
-- completed transfers with from_country/to_country existed.
--
-- This adds the company-scoped read, mirroring `scan_logs_company_read` /
-- `claims_company_read` / `ownership_records_company_read`: a brand may read
-- transfers on its own products' tags (its own resale provenance) and nothing
-- else. The anon/public leak stays closed (no `USING (true)` is restored).
--
-- Idempotent — safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "transfers_company_read" ON transfer_requests;
CREATE POLICY "transfers_company_read" ON transfer_requests
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

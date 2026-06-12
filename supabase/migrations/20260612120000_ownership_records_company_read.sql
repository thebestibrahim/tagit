-- ============================================================
-- Restore brand read access to ownership_records (regression fix)
--
-- 20260610000000_tighten_public_rls.sql dropped `ownership_public_read`
-- (FOR SELECT USING (TRUE)) to close a PII leak — correct. But its note
-- claimed "authenticated brands read their own rows via the *_company_*
-- policies." No such policy existed on ownership_records: the only SELECT
-- path was the public-read grant. So once it was dropped, the brand
-- Ownership → Owners ledger (a user-scoped query via the anon client with
-- RLS enforced) returned ZERO rows — the page looked empty even though the
-- records exist.
--
-- This adds the missing company-scoped read, mirroring `claims_company_read`
-- on ownership_claims: a brand may read ownership of products tied to its
-- own tags (its own provenance ledger — data it is entitled to), and nothing
-- else. The anon/public leak stays closed.
--
-- Idempotent — safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "ownership_company_read" ON ownership_records;
CREATE POLICY "ownership_company_read" ON ownership_records
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

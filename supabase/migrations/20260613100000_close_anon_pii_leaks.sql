-- ============================================================
-- Close two anon-key PII leaks found in the maintenance audit
--
-- The anon key ships in the client bundle, so any `FOR ... TO public
-- USING (true)` policy is world-readable/writable via the Supabase REST API.
-- Two tables still carried such policies (missed by 20260610's sweep):
--
-- 1. brand_inquiries — a SINGLE policy "service role full access" that was
--    FOR ALL TO public USING(true) WITH CHECK(true) (misnamed; not scoped to
--    the service role at all). Anon could READ, UPDATE and DELETE every
--    inquiry (business name/email/message). All real access is server-side
--    via the service-role client (submit action + admin pages/routes), which
--    bypasses RLS — so no public/anon grant is needed.
--
-- 2. certificates — `certs_public_read` FOR SELECT TO public USING(true)
--    exposed issued_to_name + issued_to_email of every certificate. The public
--    cert page (/certificate/[id]) reads via the service-role client, and the
--    brand dashboard list also uses the service client; only the product- and
--    claim-detail pages read certificates under the brand's RLS, so they get a
--    company-scoped read instead.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ── brand_inquiries: lock down to admin + service-role only ──
-- Guarded: the table is absent on some environments (e.g. staging).
DO $$
BEGIN
  IF to_regclass('public.brand_inquiries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "service role full access" ON brand_inquiries;
    DROP POLICY IF EXISTS "inquiries_service_all" ON brand_inquiries;
    CREATE POLICY "inquiries_service_all" ON brand_inquiries
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
    DROP POLICY IF EXISTS "admin_all_inquiries" ON brand_inquiries;
    CREATE POLICY "admin_all_inquiries" ON brand_inquiries
      FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');
  END IF;
END $$;

-- ── certificates: brand-scoped read replaces the public read ──
DROP POLICY IF EXISTS "certs_company_read" ON certificates;
CREATE POLICY "certs_company_read" ON certificates
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

DROP POLICY IF EXISTS "certs_public_read" ON certificates;

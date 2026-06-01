-- ============================================================
-- Certificates RLS policies (idempotent)
--
-- The certificates table was added after docs/schema.sql, so the
-- earlier RLS-restore migration did not cover it. Staging had RLS
-- enabled on certificates with NO policies, blocking all access.
-- This mirrors the policy set already present on production.
-- ============================================================

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public read so consumer scan pages can display/verify certificates.
DROP POLICY IF EXISTS "certs_public_read" ON certificates;
CREATE POLICY "certs_public_read" ON certificates
  FOR SELECT USING (TRUE);

-- Only the service role (API routes) creates certificates.
DROP POLICY IF EXISTS "certs_service_insert" ON certificates;
CREATE POLICY "certs_service_insert" ON certificates
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Tagit admins have full access.
DROP POLICY IF EXISTS "admin_all_certs" ON certificates;
CREATE POLICY "admin_all_certs" ON certificates
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

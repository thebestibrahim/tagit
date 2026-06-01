-- ============================================================
-- Restore RLS policies (idempotent)
--
-- Staging was missing the company self-access policies, which made
-- every approved brand fail the dashboard access gate ("Access denied"),
-- because companies could not read their own row under RLS.
--
-- This migration re-asserts the full intended policy set from
-- docs/schema.sql. Each policy is dropped-if-exists then recreated so
-- it is safe to run against an environment that already has some of them.
-- ============================================================

-- ---------- COMPANIES ----------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_own" ON companies;
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "companies_update_own" ON companies;
CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "admin_all_companies" ON companies;
CREATE POLICY "admin_all_companies" ON companies
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- TAGS ----------
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_company_select" ON tags;
CREATE POLICY "tags_company_select" ON tags
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "tags_company_insert" ON tags;
CREATE POLICY "tags_company_insert" ON tags
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "tags_company_update" ON tags;
CREATE POLICY "tags_company_update" ON tags
  FOR UPDATE USING (company_id = auth.uid());

DROP POLICY IF EXISTS "tags_public_read_by_token" ON tags;
CREATE POLICY "tags_public_read_by_token" ON tags
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "admin_all_tags" ON tags;
CREATE POLICY "admin_all_tags" ON tags
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- TAG BATCHES ----------
ALTER TABLE tag_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batches_company_read" ON tag_batches;
CREATE POLICY "batches_company_read" ON tag_batches
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_batches" ON tag_batches;
CREATE POLICY "admin_all_batches" ON tag_batches
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- PRODUCTS ----------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_company_select" ON products;
CREATE POLICY "products_company_select" ON products
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "products_company_insert" ON products;
CREATE POLICY "products_company_insert" ON products
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "products_company_update" ON products;
CREATE POLICY "products_company_update" ON products
  FOR UPDATE USING (company_id = auth.uid());

DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "admin_all_products" ON products;
CREATE POLICY "admin_all_products" ON products
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- OWNERSHIP RECORDS ----------
ALTER TABLE ownership_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ownership_public_read" ON ownership_records;
CREATE POLICY "ownership_public_read" ON ownership_records
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "admin_all_ownership" ON ownership_records;
CREATE POLICY "admin_all_ownership" ON ownership_records
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

DROP POLICY IF EXISTS "ownership_service_write" ON ownership_records;
CREATE POLICY "ownership_service_write" ON ownership_records
  FOR ALL USING (auth.role() = 'service_role');

-- ---------- OWNERSHIP CLAIMS ----------
ALTER TABLE ownership_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claims_company_read" ON ownership_claims;
CREATE POLICY "claims_company_read" ON ownership_claims
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

DROP POLICY IF EXISTS "claims_company_update" ON ownership_claims;
CREATE POLICY "claims_company_update" ON ownership_claims
  FOR UPDATE USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

DROP POLICY IF EXISTS "claims_service_insert" ON ownership_claims;
CREATE POLICY "claims_service_insert" ON ownership_claims
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_claims" ON ownership_claims;
CREATE POLICY "admin_all_claims" ON ownership_claims
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- TRANSFER REQUESTS ----------
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transfers_public_read_by_token" ON transfer_requests;
CREATE POLICY "transfers_public_read_by_token" ON transfer_requests
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "transfers_service_all" ON transfer_requests;
CREATE POLICY "transfers_service_all" ON transfer_requests
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_transfers" ON transfer_requests;
CREATE POLICY "admin_all_transfers" ON transfer_requests
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- OTP CODES ----------
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "otp_service_all" ON otp_codes;
CREATE POLICY "otp_service_all" ON otp_codes
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_otp" ON otp_codes;
CREATE POLICY "admin_all_otp" ON otp_codes
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- SCAN LOGS ----------
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scan_logs_company_read" ON scan_logs;
CREATE POLICY "scan_logs_company_read" ON scan_logs
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

DROP POLICY IF EXISTS "scan_logs_service_insert" ON scan_logs;
CREATE POLICY "scan_logs_service_insert" ON scan_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_scan_logs" ON scan_logs;
CREATE POLICY "admin_all_scan_logs" ON scan_logs
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- AUDIT LOG ----------
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_service_insert" ON audit_log;
CREATE POLICY "audit_service_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_audit" ON audit_log;
CREATE POLICY "admin_all_audit" ON audit_log
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ---------- INDUSTRY WAITLIST ----------
ALTER TABLE industry_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_company_insert" ON industry_waitlist;
CREATE POLICY "waitlist_company_insert" ON industry_waitlist
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "waitlist_company_read" ON industry_waitlist;
CREATE POLICY "waitlist_company_read" ON industry_waitlist
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_waitlist" ON industry_waitlist;
CREATE POLICY "admin_all_waitlist" ON industry_waitlist
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

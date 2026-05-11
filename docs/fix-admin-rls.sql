-- Fix admin RLS policies: role is at app_metadata.role, not jwt top-level role
-- Run this in Supabase SQL Editor

-- companies
DROP POLICY IF EXISTS "admin_all_companies" ON companies;
CREATE POLICY "admin_all_companies" ON companies
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- tags
DROP POLICY IF EXISTS "admin_all_tags" ON tags;
CREATE POLICY "admin_all_tags" ON tags
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- tag_batches
DROP POLICY IF EXISTS "admin_all_batches" ON tag_batches;
CREATE POLICY "admin_all_batches" ON tag_batches
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- products
DROP POLICY IF EXISTS "admin_all_products" ON products;
CREATE POLICY "admin_all_products" ON products
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ownership_records
DROP POLICY IF EXISTS "admin_all_ownership" ON ownership_records;
CREATE POLICY "admin_all_ownership" ON ownership_records
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ownership_claims
DROP POLICY IF EXISTS "admin_all_claims" ON ownership_claims;
CREATE POLICY "admin_all_claims" ON ownership_claims
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- transfer_requests
DROP POLICY IF EXISTS "admin_all_transfers" ON transfer_requests;
CREATE POLICY "admin_all_transfers" ON transfer_requests
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- otp_codes
DROP POLICY IF EXISTS "admin_all_otp" ON otp_codes;
CREATE POLICY "admin_all_otp" ON otp_codes
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- scan_logs
DROP POLICY IF EXISTS "admin_all_scan_logs" ON scan_logs;
CREATE POLICY "admin_all_scan_logs" ON scan_logs
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- audit_log
DROP POLICY IF EXISTS "admin_all_audit" ON audit_log;
CREATE POLICY "admin_all_audit" ON audit_log
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- industry_waitlist
DROP POLICY IF EXISTS "admin_all_waitlist" ON industry_waitlist;
CREATE POLICY "admin_all_waitlist" ON industry_waitlist
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

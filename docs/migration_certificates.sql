-- ============================================================
-- TAGIT — Certificates Migration
-- Run this in Supabase SQL Editor after the main schema.sql
-- ============================================================

-- Add certificate template preference to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS cert_template TEXT DEFAULT 'classic'
    CHECK (cert_template IN ('classic', 'minimal', 'heritage'));

-- ============================================================
-- CERTIFICATES
-- Immutable record of every issued ownership or transfer cert.
-- The PDF is delivered by email; this table is the authoritative
-- ledger entry that powers the public /certificate/[id] page.
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number         TEXT UNIQUE NOT NULL,          -- e.g. TGT-2026-A4X7F2
  ownership_record_id UUID REFERENCES ownership_records(id),
  tag_id              UUID REFERENCES tags(id) NOT NULL,
  cert_type           TEXT NOT NULL CHECK (cert_type IN ('ownership', 'transfer')),
  template            TEXT NOT NULL DEFAULT 'classic'
                        CHECK (template IN ('classic', 'minimal', 'heritage')),
  issued_to_name      TEXT NOT NULL,
  issued_to_email     TEXT NOT NULL,
  issued_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public read — anyone with the cert URL can verify it
CREATE POLICY "certs_public_read" ON certificates
  FOR SELECT USING (TRUE);

-- Only service role (API routes) can create certificates
CREATE POLICY "certs_service_insert" ON certificates
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admins have full access
CREATE POLICY "admin_all_certs" ON certificates
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

CREATE INDEX IF NOT EXISTS idx_certificates_tag        ON certificates(tag_id);
CREATE INDEX IF NOT EXISTS idx_certificates_ownership  ON certificates(ownership_record_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number     ON certificates(cert_number);

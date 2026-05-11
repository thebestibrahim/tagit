-- ============================================================
-- TAGIT — Complete Database Schema with RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE companies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  industry             TEXT NOT NULL CHECK (industry IN ('fashion', 'arts', 'collectibles', 'restaurants', 'hotels')),
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  logo_url             TEXT,
  brand_primary_color  TEXT DEFAULT '#0A0A0B',
  brand_secondary_color TEXT DEFAULT '#FAFAF8',
  brand_accent_color   TEXT DEFAULT '#B8945D',
  brand_font           TEXT DEFAULT 'body',
  brand_story          TEXT,
  custom_header_text   TEXT,
  social_links         JSONB DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  approved_at          TIMESTAMPTZ,
  approved_by          UUID
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Companies see only their own record (matched by their Supabase auth user id)
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (id = auth.uid());

-- Tagit admins have full access to all tables (checked via JWT claim)
CREATE POLICY "admin_all_companies" ON companies
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT UNIQUE NOT NULL,        -- nanoid token used in URL
  short_id        TEXT UNIQUE NOT NULL,        -- human-readable SVI e.g. X7F3C9
  company_id      UUID REFERENCES companies(id) NOT NULL,
  industry        TEXT NOT NULL,
  batch_id        UUID,
  status          TEXT NOT NULL DEFAULT 'created' CHECK (
                    status IN (
                      'created', 'written', 'shipped', 'embedded',
                      'activated', 'unowned', 'claim_pending',
                      'owned', 'transfer_pending', 'flagged', 'suspended'
                    )
                  ),
  hmac_signature  TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  activated_at    TIMESTAMPTZ
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_company_select" ON tags
  FOR SELECT USING (company_id = auth.uid());

CREATE POLICY "tags_company_insert" ON tags
  FOR INSERT WITH CHECK (company_id = auth.uid());

CREATE POLICY "tags_company_update" ON tags
  FOR UPDATE USING (company_id = auth.uid());

-- Public read for consumer scan page (no auth required to view tag token)
CREATE POLICY "tags_public_read_by_token" ON tags
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_tags" ON tags
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- TAG BATCHES
-- ============================================================
CREATE TABLE tag_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) NOT NULL,
  industry    TEXT NOT NULL,
  batch_size  INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'written', 'shipped')),
  notes       TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  shipped_at  TIMESTAMPTZ
);

ALTER TABLE tag_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_company_read" ON tag_batches
  FOR SELECT USING (company_id = auth.uid());

CREATE POLICY "admin_all_batches" ON tag_batches
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id            UUID REFERENCES tags(id) UNIQUE NOT NULL,
  company_id        UUID REFERENCES companies(id) NOT NULL,
  name              TEXT NOT NULL,
  industry_fields   JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos            TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_persona_config JSONB DEFAULT '{}'::jsonb,
  retail_price      NUMERIC(12, 2),
  currency          TEXT DEFAULT 'NGN',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_company_select" ON products
  FOR SELECT USING (company_id = auth.uid());

CREATE POLICY "products_company_insert" ON products
  FOR INSERT WITH CHECK (company_id = auth.uid());

CREATE POLICY "products_company_update" ON products
  FOR UPDATE USING (company_id = auth.uid());

-- Public read for consumer scan page
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_products" ON products
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- OWNERSHIP RECORDS
-- ============================================================
CREATE TABLE ownership_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id           UUID REFERENCES tags(id) NOT NULL,
  owner_name       TEXT NOT NULL,
  owner_email      TEXT NOT NULL,
  backup_email     TEXT,
  acquisition_type TEXT NOT NULL CHECK (acquisition_type IN ('origin', 'transfer')),
  acquired_from_id UUID REFERENCES ownership_records(id),
  acquired_at      TIMESTAMPTZ DEFAULT NOW(),
  sale_price       NUMERIC(12, 2),
  currency         TEXT DEFAULT 'NGN',
  is_current       BOOLEAN DEFAULT TRUE,
  ended_at         TIMESTAMPTZ
);

ALTER TABLE ownership_records ENABLE ROW LEVEL SECURITY;

-- Public read for provenance display; owners identified by email match in app logic
CREATE POLICY "ownership_public_read" ON ownership_records
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_ownership" ON ownership_records
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- Only service role can insert/update ownership records (via API routes)
CREATE POLICY "ownership_service_write" ON ownership_records
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- OWNERSHIP CLAIMS
-- ============================================================
CREATE TABLE ownership_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id           UUID REFERENCES tags(id) NOT NULL,
  claimant_name    TEXT NOT NULL,
  claimant_email   TEXT NOT NULL,
  claim_ip         TEXT,
  claim_location   TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (
                     status IN ('pending', 'approved', 'rejected', 'expired')
                   ),
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE ownership_claims ENABLE ROW LEVEL SECURITY;

-- Companies see claims on their own tags
CREATE POLICY "claims_company_read" ON ownership_claims
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

CREATE POLICY "claims_company_update" ON ownership_claims
  FOR UPDATE USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

-- Service role handles inserts
CREATE POLICY "claims_service_insert" ON ownership_claims
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_all_claims" ON ownership_claims
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- TRANSFER REQUESTS
-- ============================================================
CREATE TABLE transfer_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id           UUID REFERENCES tags(id) NOT NULL,
  from_owner_id    UUID REFERENCES ownership_records(id) NOT NULL,
  to_name          TEXT NOT NULL,
  to_email         TEXT NOT NULL,
  sale_price       NUMERIC(12, 2),
  status           TEXT NOT NULL DEFAULT 'otp_pending' CHECK (
                     status IN (
                       'otp_pending', 'otp_verified', 'awaiting_acceptance',
                       'completed', 'expired', 'cancelled'
                     )
                   ),
  acceptance_token TEXT UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at     TIMESTAMPTZ
);

ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_public_read_by_token" ON transfer_requests
  FOR SELECT USING (TRUE);

CREATE POLICY "transfers_service_all" ON transfer_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_transfers" ON transfer_requests
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- OTP CODES
-- ============================================================
CREATE TABLE otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  purpose    TEXT NOT NULL,
  attempts   INTEGER DEFAULT 0,
  is_used    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Only service role accesses OTP codes
CREATE POLICY "otp_service_all" ON otp_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_otp" ON otp_codes
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- SCAN LOGS
-- ============================================================
CREATE TABLE scan_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id       UUID REFERENCES tags(id) NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  geo_location JSONB,
  session_id   TEXT,
  scan_result  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Companies see scan logs for their own tags
CREATE POLICY "scan_logs_company_read" ON scan_logs
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE company_id = auth.uid())
  );

CREATE POLICY "scan_logs_service_insert" ON scan_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_all_scan_logs" ON scan_logs
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  action          TEXT NOT NULL,
  field_changed   TEXT,
  old_value       JSONB,
  new_value       JSONB,
  changed_by      UUID,
  changed_by_role TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_service_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_all_audit" ON audit_log
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- INDUSTRY WAITLIST
-- ============================================================
CREATE TABLE industry_waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  industry   TEXT NOT NULL CHECK (industry IN ('restaurants', 'hotels')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE industry_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist_company_insert" ON industry_waitlist
  FOR INSERT WITH CHECK (company_id = auth.uid());

CREATE POLICY "waitlist_company_read" ON industry_waitlist
  FOR SELECT USING (company_id = auth.uid());

CREATE POLICY "admin_all_waitlist" ON industry_waitlist
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tags_token         ON tags(token);
CREATE INDEX idx_tags_short_id      ON tags(short_id);
CREATE INDEX idx_tags_company_id    ON tags(company_id);
CREATE INDEX idx_tags_batch_id      ON tags(batch_id);
CREATE INDEX idx_products_tag_id    ON products(tag_id);
CREATE INDEX idx_products_company   ON products(company_id);
CREATE INDEX idx_ownership_tag      ON ownership_records(tag_id);
CREATE INDEX idx_ownership_current  ON ownership_records(tag_id, is_current);
CREATE INDEX idx_claims_tag         ON ownership_claims(tag_id);
CREATE INDEX idx_claims_status      ON ownership_claims(status);
CREATE INDEX idx_transfers_tag      ON transfer_requests(tag_id);
CREATE INDEX idx_transfers_token    ON transfer_requests(acceptance_token);
CREATE INDEX idx_scan_logs_tag      ON scan_logs(tag_id);
CREATE INDEX idx_scan_logs_created  ON scan_logs(created_at DESC);
CREATE INDEX idx_otp_email          ON otp_codes(email);
CREATE INDEX idx_otp_expires        ON otp_codes(expires_at);

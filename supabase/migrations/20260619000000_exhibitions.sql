-- ============================================================
-- Exhibition QR info pages.
--
-- A purely additive information layer for exhibitions: a brand can attach
-- products to an exhibition and mint a public QR "info code" per product.
-- Scanning it shows reference information drawn ONLY from the product's
-- registration record. It plays NO role in authentication or ownership; the
-- NFC chip and card remain the sole root of trust. These tables never touch
-- ownership_records or transfer_requests.
--
-- Lifecycle is fully manual (active / inactive / revoked). Exhibition dates
-- are organisational labels only and drive no expiry logic.
--
-- Read/written server-side through the service-role client (same pattern as
-- /v/[token] and the brand page), after the route verifies the brand owns the
-- row. RLS is still enabled so the anon key can never reach these tables.
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exhibition_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, product_id)
);

CREATE TABLE IF NOT EXISTS info_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'revoked')
  ),
  scan_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_info_codes_token ON info_codes(token);
CREATE INDEX IF NOT EXISTS idx_info_codes_exhibition
  ON info_codes(exhibition_id);

ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_codes ENABLE ROW LEVEL SECURITY;

-- Brand owns its rows (company id == auth.uid()).
DROP POLICY IF EXISTS "brands_own_exhibitions" ON exhibitions;
CREATE POLICY "brands_own_exhibitions" ON exhibitions
  FOR ALL USING (company_id = auth.uid());

DROP POLICY IF EXISTS "brands_own_exhibition_products" ON exhibition_products;
CREATE POLICY "brands_own_exhibition_products"
  ON exhibition_products FOR ALL USING (
    exhibition_id IN (
      SELECT id FROM exhibitions WHERE company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "brands_own_info_codes" ON info_codes;
CREATE POLICY "brands_own_info_codes" ON info_codes
  FOR ALL USING (company_id = auth.uid());

-- Service role (server-side admin client) + Tagit admins. Mirrors the rest of
-- the schema so server routes and the admin dashboard keep full access while
-- the anon key stays locked out.
DROP POLICY IF EXISTS "exhibitions_service_all" ON exhibitions;
CREATE POLICY "exhibitions_service_all" ON exhibitions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_all_exhibitions" ON exhibitions;
CREATE POLICY "admin_all_exhibitions" ON exhibitions
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

DROP POLICY IF EXISTS "exhibition_products_service_all" ON exhibition_products;
CREATE POLICY "exhibition_products_service_all" ON exhibition_products
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_all_exhibition_products" ON exhibition_products;
CREATE POLICY "admin_all_exhibition_products" ON exhibition_products
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

DROP POLICY IF EXISTS "info_codes_service_all" ON info_codes;
CREATE POLICY "info_codes_service_all" ON info_codes
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_all_info_codes" ON info_codes;
CREATE POLICY "admin_all_info_codes" ON info_codes
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ── scan_logs: reuse the existing scan-logging table for info-code scans ──
-- A scan can now originate from a chip (the default) or an exhibition QR info
-- code. tag_id becomes nullable so an info-code scan can be logged without a
-- tag, and a nullable info_code_id + a `source` tag distinguish the two. The
-- default 'chip' keeps every existing row and every chip scan unchanged.
ALTER TABLE scan_logs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'chip',
  ADD COLUMN IF NOT EXISTS info_code_id UUID REFERENCES info_codes(id);

ALTER TABLE scan_logs ALTER COLUMN tag_id DROP NOT NULL;

-- A row is either a chip scan (tag_id set) or an info-code scan (info_code_id
-- set), never neither.
ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_subject_present;
ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_subject_present
  CHECK (tag_id IS NOT NULL OR info_code_id IS NOT NULL);

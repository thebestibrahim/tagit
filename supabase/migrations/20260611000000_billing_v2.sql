-- ═══════════════════════════════════════════════════════════════════════════
-- BILLING ENGINE v2
-- Plans, subscriptions, discounts, brand pricing, invoices, line items, payments
-- ═══════════════════════════════════════════════════════════════════════════
-- All monetary amounts are stored in KOBO (1 NGN = 100 kobo).
--
-- Admin RLS note: this project sets the staff role in the JWT's app_metadata
-- (user.app_metadata.role === 'tagit_admin'), NOT in the top-level `role`
-- claim (which is the Postgres role: authenticated/anon). So admin policies
-- read `auth.jwt() -> 'app_metadata' ->> 'role'`. Admin API routes go through
-- the service-role client anyway (RLS bypassed); these policies are defence in
-- depth. Brands are identified by companies.id = auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════

-- Clean recreate: drop any partial billing tables from a previous attempt.
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS brand_pricing CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- ─────────────────────────────────────────────
-- PLANS
-- ─────────────────────────────────────────────
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_price INTEGER NOT NULL DEFAULT 0, -- kobo
  included_chips INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard plans (only if empty)
INSERT INTO plans (name, monthly_price, included_chips)
SELECT * FROM (VALUES
  ('Marque',  2500000,  10),
  ('Atelier', 15000000, 50),
  ('Maison',  40000000, 200),
  ('Bespoke', 0,        0)
) AS v(name, monthly_price, included_chips)
WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1);

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (
    status IN ('trialing', 'active', 'past_due', 'suspended', 'cancelled')
  ),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (
    billing_interval IN ('monthly', 'quarterly', 'annually')
  ),
  custom_monthly_price INTEGER, -- overrides plan price when set, in kobo
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ─────────────────────────────────────────────
-- DISCOUNTS
-- One subscription discount + one batch discount per brand, independent.
-- duration = billing cycles (subscription) or number of orders (batch).
-- ─────────────────────────────────────────────
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'batch')),
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  duration INTEGER NOT NULL CHECK (duration > 0),
  used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_by UUID,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active discount per type per brand
CREATE UNIQUE INDEX idx_discounts_one_active_per_type
  ON discounts(company_id, type)
  WHERE is_active = TRUE;

CREATE INDEX idx_discounts_company ON discounts(company_id)
  WHERE is_active = TRUE;

-- ─────────────────────────────────────────────
-- BRAND PRICING — custom volume tiers per brand
-- tiers: [{"min":1,"max":50,"price_per_unit":400000}, ...]  (kobo, max null = no cap)
-- ─────────────────────────────────────────────
CREATE TABLE brand_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tag_tiers JSONB NOT NULL DEFAULT '[
    {"min": 1,   "max": 50,   "price_per_unit": 400000},
    {"min": 51,  "max": 100,  "price_per_unit": 350000},
    {"min": 101, "max": 200,  "price_per_unit": 300000},
    {"min": 201, "max": null, "price_per_unit": 250000}
  ]'::jsonb,
  card_tiers JSONB NOT NULL DEFAULT '[
    {"min": 1,   "max": 50,   "price_per_unit": 400000},
    {"min": 51,  "max": 100,  "price_per_unit": 350000},
    {"min": 101, "max": 200,  "price_per_unit": 300000},
    {"min": 201, "max": null, "price_per_unit": 250000}
  ]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'batch')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')
  ),
  subtotal INTEGER NOT NULL,                  -- before discount, kobo
  discount_amount INTEGER NOT NULL DEFAULT 0, -- kobo
  amount INTEGER NOT NULL,                    -- final, after discount, kobo
  discount_id UUID REFERENCES discounts(id),
  discount_percentage INTEGER,                -- snapshot at invoice time
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  paystack_payment_link TEXT,
  paystack_reference TEXT UNIQUE,
  batch_id UUID REFERENCES tag_batches(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  -- Delinquency reminder tracking
  reminder_3_sent_at TIMESTAMPTZ,
  reminder_7_sent_at TIMESTAMPTZ,
  reminder_14_sent_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date)
  WHERE status IN ('sent', 'overdue');

-- ─────────────────────────────────────────────
-- INVOICE LINE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- kobo
  total INTEGER NOT NULL,      -- kobo
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- kobo
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paystack_payload JSONB
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admin full access (role lives in app_metadata in this project)
CREATE POLICY "admin_plans" ON plans FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_subscriptions" ON subscriptions FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_discounts" ON discounts FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_pricing" ON brand_pricing FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_invoices" ON invoices FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_line_items" ON invoice_line_items FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');
CREATE POLICY "admin_payments" ON payments FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'tagit_admin');

-- Plans: any authenticated/anon can read active plans (needed at signup)
CREATE POLICY "public_plans" ON plans FOR SELECT
  USING (is_active = TRUE);

-- Brands: read their own data only (companies.id = auth.uid())
CREATE POLICY "brands_own_subscription" ON subscriptions
  FOR SELECT USING (company_id = auth.uid());
CREATE POLICY "brands_own_discount" ON discounts
  FOR SELECT USING (company_id = auth.uid());
CREATE POLICY "brands_own_pricing" ON brand_pricing
  FOR SELECT USING (company_id = auth.uid());
CREATE POLICY "brands_own_invoices" ON invoices
  FOR SELECT USING (company_id = auth.uid());
CREATE POLICY "brands_own_line_items" ON invoice_line_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id = auth.uid())
  );

-- Custom domains: brands can connect their own domain to serve their Tagit brand page.
-- One domain per brand. Status tracks Vercel provisioning lifecycle.

CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) UNIQUE NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'verified', 'failed', 'removed')
  ),
  vercel_domain_id TEXT,
  verification_records JSONB,
  failure_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Brands can only see and manage their own domain row
CREATE POLICY "brands_own_domain" ON custom_domains
  FOR ALL USING (company_id = auth.uid());

-- Tagit admins have full access
CREATE POLICY "admin_all_domains" ON custom_domains
  FOR ALL USING (auth.jwt() ->> 'role' = 'tagit_admin');

-- Feature flag for custom domain capability
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage, environments)
VALUES (
  'custom_domain',
  'Custom Domain',
  'Brands can connect their own domain (e.g. bushuaart.com) to serve their Tagit brand page. Admin must enable per brand — being on Atelier or above is the suggested baseline, not an automatic unlock.',
  false,
  0,
  ARRAY['production', 'staging']
)
ON CONFLICT (key) DO NOTHING;

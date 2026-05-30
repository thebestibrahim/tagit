-- Tagit staging schema — recreated from production types
-- Apply this to a fresh staging Supabase project before running seed.ts

-- ── companies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  logo_url TEXT,
  signature_url TEXT,
  brand_primary_color TEXT,
  brand_secondary_color TEXT,
  brand_accent_color TEXT,
  brand_text_color TEXT,
  brand_font TEXT,
  brand_template TEXT,
  brand_story TEXT,
  custom_header_text TEXT,
  cert_template TEXT,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_persona_name TEXT,
  ai_persona_prompt TEXT,
  ai_persona_voice_id TEXT,
  elevenlabs_api_key TEXT,
  social_links JSONB,
  contact_name TEXT,
  contact_phone TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── products ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  industry_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos TEXT[],
  retail_price NUMERIC,
  currency TEXT,
  ai_persona_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── tag_batches ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tag_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  industry TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  batch_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── tags ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  token TEXT NOT NULL UNIQUE,
  short_id TEXT NOT NULL UNIQUE,
  hmac_signature TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  product_id UUID REFERENCES products(id),
  batch_id UUID REFERENCES tag_batches(id),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ownership_records ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id),
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  backup_email TEXT,
  acquisition_type TEXT NOT NULL DEFAULT 'claim',
  acquired_at TIMESTAMPTZ,
  acquired_from_id UUID REFERENCES ownership_records(id),
  sale_price NUMERIC,
  currency TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMPTZ
);

-- ── ownership_claims ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id),
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  claim_ip TEXT,
  claim_location TEXT,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── certificates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id),
  ownership_record_id UUID REFERENCES ownership_records(id),
  cert_number TEXT NOT NULL,
  cert_type TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'classic',
  issued_to_name TEXT NOT NULL,
  issued_to_email TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── transfer_requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id),
  from_owner_id UUID NOT NULL,
  to_name TEXT NOT NULL,
  to_email TEXT NOT NULL,
  sale_price NUMERIC,
  currency TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  acceptance_token TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── scan_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id),
  scan_result TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  geo_location JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── otp_codes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── audit_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  changed_by_role TEXT,
  ip_address TEXT,
  field_changed TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── industry_waitlist ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industry_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_waitlist ENABLE ROW LEVEL SECURITY;

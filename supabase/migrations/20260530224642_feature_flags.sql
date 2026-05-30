-- Feature flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  environments TEXT[] NOT NULL DEFAULT ARRAY['production','staging']::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_updated_by UUID REFERENCES auth.users(id)
);

-- Brand and user overrides
CREATE TABLE feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'user')),
  entity_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(flag_id, entity_type, entity_id)
);

-- Immutable audit trail
CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id),
  flag_key TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_by_email TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

-- Performance indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_overrides_flag ON feature_flag_overrides(flag_id);
CREATE INDEX idx_overrides_entity ON feature_flag_overrides(entity_type, entity_id);
CREATE INDEX idx_audit_flag_id ON feature_flag_audit(flag_id);
CREATE INDEX idx_audit_performed_at ON feature_flag_audit(performed_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_full_flags" ON feature_flags
  FOR ALL USING (auth.jwt() ->> 'role' = 'tagit_admin');

CREATE POLICY "admin_full_overrides" ON feature_flag_overrides
  FOR ALL USING (auth.jwt() ->> 'role' = 'tagit_admin');

-- Audit is insert-only for admins, no updates or deletes ever
CREATE POLICY "admin_insert_audit" ON feature_flag_audit
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'tagit_admin');

CREATE POLICY "admin_read_audit" ON feature_flag_audit
  FOR SELECT USING (auth.jwt() ->> 'role' = 'tagit_admin');

-- Brands can read their own overrides only
CREATE POLICY "brands_read_own_overrides" ON feature_flag_overrides
  FOR SELECT USING (
    entity_type = 'brand' AND entity_id = auth.uid()
  );

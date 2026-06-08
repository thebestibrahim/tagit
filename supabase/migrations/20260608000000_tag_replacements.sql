-- ============================================================
-- Tag / Card replacement.
--
-- A brand can swap a broken, damaged, or missing chip (tag OR card) on a
-- product for a fresh, unassigned chip from their own inventory. The old chip
-- is decommissioned (retired, never reusable); the new chip takes the old
-- chip's place AND its ownership stage, so the product's lifecycle state and
-- ownership records are untouched.
--
-- This migration:
--   1. Adds the terminal `decommissioned` status to the tag status vocabulary.
--   2. Creates the tag_replacements audit table + RLS.
--   3. Adds the atomic replace_chip() RPC (decommission old, assign new,
--      record the audit row — all in one transaction).
--
-- Idempotent & additive — safe to re-run.
-- ============================================================

-- ── 1. Extend the tag status vocabulary with `decommissioned` ──
-- A decommissioned chip is retired forever: product_id is cleared and it can
-- never be reassigned. (The 7-state set shipped in 20260603000000_prd_v3_lifecycle.)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_status_check;
ALTER TABLE tags
  ADD CONSTRAINT tags_status_check
  CHECK (status IN (
    'created', 'shipped', 'live', 'owned', 'transferred',
    'flagged', 'suspended', 'decommissioned'
  ));

-- ── 2. Audit table — one row per replacement ──
CREATE TABLE IF NOT EXISTS tag_replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  old_tag_id UUID REFERENCES tags(id) NOT NULL,
  new_tag_id UUID REFERENCES tags(id) NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('tag', 'card')),
  reason TEXT NOT NULL CHECK (reason IN (
    'not_scanning',
    'physically_damaged',
    'missing_or_lost'
  )),
  initiated_by UUID REFERENCES companies(id) NOT NULL,
  owner_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tag_replacements_product_idx ON tag_replacements (product_id);
CREATE INDEX IF NOT EXISTS tag_replacements_initiated_by_idx ON tag_replacements (initiated_by);

ALTER TABLE tag_replacements ENABLE ROW LEVEL SECURITY;

-- A brand sees only the replacements it initiated. company.id == auth.uid().
DROP POLICY IF EXISTS "brands_own_replacements" ON tag_replacements;
CREATE POLICY "brands_own_replacements" ON tag_replacements
  FOR ALL USING (initiated_by = auth.uid());

-- Tagit admins have full access. Role lives in app_metadata in this project
-- (matches admin_all_tags / admin_all_companies), not the top-level claim.
DROP POLICY IF EXISTS "admin_all_replacements" ON tag_replacements;
CREATE POLICY "admin_all_replacements" ON tag_replacements
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tagit_admin');

-- ── 3. Atomic replacement RPC ──
-- All three writes happen in ONE transaction. The new chip inherits the old
-- chip's status so the product keeps its exact ownership stage. Ownership
-- records are deliberately left untouched. SECURITY DEFINER + locked rows so
-- a concurrent assignment can't slip a chip out from under us.
CREATE OR REPLACE FUNCTION replace_chip(
  p_product_id    UUID,
  p_old_tag_id    UUID,
  p_new_tag_id    UUID,
  p_medium        TEXT,
  p_reason        TEXT,
  p_initiated_by  UUID
)
RETURNS TABLE (replacement_id UUID, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old        tags%ROWTYPE;
  v_new        tags%ROWTYPE;
  v_repl_id    UUID;
BEGIN
  SELECT * INTO v_old FROM tags WHERE id = p_old_tag_id FOR UPDATE;
  SELECT * INTO v_new FROM tags WHERE id = p_new_tag_id FOR UPDATE;

  -- Re-validate under lock — guards against a race between the route's checks
  -- and this transaction.
  IF v_old.id IS NULL OR v_new.id IS NULL THEN
    RAISE EXCEPTION 'replace_chip: chip not found';
  END IF;
  IF v_new.product_id IS NOT NULL THEN
    RAISE EXCEPTION 'replace_chip: replacement chip already assigned';
  END IF;
  IF v_new.status IN ('decommissioned', 'flagged') THEN
    RAISE EXCEPTION 'replace_chip: replacement chip is not available';
  END IF;

  -- Retire the old chip FIRST so the one-card-per-product unique index has
  -- room for the new card before it is attached.
  UPDATE tags
     SET status = 'decommissioned', product_id = NULL
   WHERE id = p_old_tag_id;

  -- New chip takes the old chip's place and inherits its ownership stage.
  UPDATE tags
     SET product_id = p_product_id, status = v_old.status
   WHERE id = p_new_tag_id;

  INSERT INTO tag_replacements
    (product_id, old_tag_id, new_tag_id, medium, reason, initiated_by)
  VALUES
    (p_product_id, p_old_tag_id, p_new_tag_id, p_medium, p_reason, p_initiated_by)
  RETURNING id INTO v_repl_id;

  RETURN QUERY SELECT v_repl_id, v_old.status;
END;
$$;

REVOKE ALL ON FUNCTION replace_chip(UUID, UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_chip(UUID, UUID, UUID, TEXT, TEXT, UUID) TO service_role;

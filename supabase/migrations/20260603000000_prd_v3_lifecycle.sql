-- ============================================================
-- PRD v3.0 — Tag lifecycle refactor + atomic ownership RPCs
--
-- 1. Collapse the 11-state tag pipeline to:
--      created → shipped → live → owned → transferred  (+ flagged / suspended)
--    The tag's status now encodes ONLY the ownership stage. Transient
--    "pending" states (claim pending / transfer pending) are derived from
--    the ownership_claims / transfer_requests tables, never stored on the tag.
-- 2. Add SECURITY DEFINER RPCs so claim-confirm and transfer-complete each
--    happen in a SINGLE transaction (atomic, idempotent).
--
-- Idempotent & data-only/additive — no column drops. Safe to re-run.
-- ============================================================

-- ── 1. Drop the old status CHECK so the backfill can write new values ──
-- The original constraint was created inline (auto-named tags_status_check)
-- and only allowed the legacy vocabulary. It may or may not still exist.
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_status_check;

-- ── 2. Backfill existing rows to the new vocabulary ──
-- created / shipped / flagged / suspended are unchanged.
UPDATE tags SET status = 'created' WHERE status = 'written';

-- All "product attached, claimable, no owner" states collapse into `live`.
-- claim_pending also maps to live: any still-pending claim row stays pending
-- and is surfaced as a derived banner; the 24h auto-confirm cron resolves it.
UPDATE tags
   SET status = 'live'
 WHERE status IN ('embedded', 'activated', 'unowned', 'linked', 'claim_pending');

-- owned / transfer_pending → resolve by how the CURRENT owner acquired the item:
--   acquired via transfer  → `transferred` (terminal, re-transferable)
--   acquired at origin/claim → `owned`
UPDATE tags t
   SET status = CASE
                  WHEN orr.acquisition_type = 'transfer' THEN 'transferred'
                  ELSE 'owned'
                END
  FROM ownership_records orr
 WHERE orr.tag_id = t.id
   AND orr.is_current = TRUE
   AND t.status IN ('owned', 'transfer_pending');

-- Any leftover transfer_pending with no current owner record falls back to owned.
UPDATE tags SET status = 'owned' WHERE status = 'transfer_pending';

-- ── 3. Re-add a CHECK with the new vocabulary ──
ALTER TABLE tags
  ADD CONSTRAINT tags_status_check
  CHECK (status IN ('created', 'shipped', 'live', 'owned', 'transferred', 'flagged', 'suspended'));

-- ============================================================
-- 4. confirm_claim(p_claim_id, p_reviewed_by) — atomic first-ownership
--    confirmation. Used by the brand early-approve button (passes reviewer)
--    and the 24h auto-confirm cron (reviewer null). No-op if not pending.
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_claim(p_claim_id UUID, p_reviewed_by UUID DEFAULT NULL)
RETURNS TABLE (ownership_record_id UUID, tag_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim    ownership_claims%ROWTYPE;
  v_owner_id UUID;
BEGIN
  SELECT * INTO v_claim FROM ownership_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND OR v_claim.status <> 'pending' THEN
    RETURN;  -- idempotent: already reviewed / does not exist
  END IF;

  INSERT INTO ownership_records (tag_id, owner_name, owner_email, acquisition_type, is_current)
  VALUES (v_claim.tag_id, v_claim.claimant_name, v_claim.claimant_email, 'origin', TRUE)
  RETURNING id INTO v_owner_id;

  UPDATE tags SET status = 'owned', activated_at = NOW() WHERE id = v_claim.tag_id;

  UPDATE ownership_claims
     SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_reviewed_by
   WHERE id = p_claim_id;

  RETURN QUERY SELECT v_owner_id, v_claim.tag_id;
END;
$$;

-- ============================================================
-- 5. complete_transfer(p_transfer_id) — atomic ownership transfer.
--    Ends the old owner record, creates the new one, flips the tag to
--    `transferred`, and marks the transfer completed — all in one tx.
--    No-op if the transfer is not awaiting_acceptance.
-- ============================================================
CREATE OR REPLACE FUNCTION complete_transfer(p_transfer_id UUID)
RETURNS TABLE (new_owner_id UUID, old_owner_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t   transfer_requests%ROWTYPE;
  v_new UUID;
BEGIN
  SELECT * INTO v_t FROM transfer_requests WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND OR v_t.status <> 'awaiting_acceptance' THEN
    RETURN;  -- idempotent: already completed / cancelled / expired
  END IF;

  UPDATE ownership_records
     SET is_current = FALSE, ended_at = NOW()
   WHERE id = v_t.from_owner_id;

  INSERT INTO ownership_records
    (tag_id, owner_name, owner_email, acquisition_type, acquired_from_id, sale_price, currency, is_current)
  VALUES
    (v_t.tag_id, v_t.to_name, v_t.to_email, 'transfer', v_t.from_owner_id,
     v_t.sale_price, COALESCE(v_t.currency, 'NGN'), TRUE)
  RETURNING id INTO v_new;

  UPDATE tags SET status = 'transferred' WHERE id = v_t.tag_id;

  UPDATE transfer_requests
     SET status = 'completed', completed_at = NOW()
   WHERE id = p_transfer_id;

  RETURN QUERY SELECT v_new, v_t.from_owner_id;
END;
$$;

-- ── 6. Lock the RPCs down to the service role only ──
-- SECURITY DEFINER functions are otherwise callable by anon/authenticated via
-- PostgREST, which would let anyone force-confirm a claim or complete a transfer.
REVOKE ALL ON FUNCTION confirm_claim(UUID, UUID)     FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_transfer(UUID)       FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_claim(UUID, UUID)  TO service_role;
GRANT EXECUTE ON FUNCTION complete_transfer(UUID)    TO service_role;

-- ownership_records were inserted by confirm_claim / complete_transfer without
-- listing acquired_at, and the rows landed NULL — so the scan page rendered
-- new Date(null) = "1 Jan 1970". Set acquired_at explicitly in both functions
-- and backfill the existing NULL rows from the best available signal.

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Use the tag's activation time (when the product group became owned), then the
-- row's ended_at (for past owners), then now() as a last resort.
UPDATE ownership_records o
SET acquired_at = COALESCE(
  (SELECT t.activated_at FROM tags t WHERE t.id = o.tag_id),
  o.ended_at,
  now()
)
WHERE o.acquired_at IS NULL;

-- ── confirm_claim: now sets acquired_at = NOW() ─────────────────────────────
CREATE OR REPLACE FUNCTION confirm_claim(p_claim_id UUID, p_reviewed_by UUID DEFAULT NULL)
RETURNS TABLE (ownership_record_id UUID, tag_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim    ownership_claims%ROWTYPE;
  v_owner_id UUID;
  v_pid      UUID;
BEGIN
  SELECT * INTO v_claim FROM ownership_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND OR v_claim.status <> 'pending' THEN
    RETURN;  -- idempotent: already reviewed / does not exist
  END IF;

  INSERT INTO ownership_records (tag_id, owner_name, owner_email, acquisition_type, acquired_at, is_current)
  VALUES (v_claim.tag_id, v_claim.claimant_name, v_claim.claimant_email, 'origin', NOW(), TRUE)
  RETURNING id INTO v_owner_id;

  -- Propagate `owned` across the whole product group (all sibling tags).
  SELECT product_id INTO v_pid FROM tags WHERE id = v_claim.tag_id;
  IF v_pid IS NOT NULL THEN
    UPDATE tags SET status = 'owned', activated_at = NOW() WHERE product_id = v_pid;
  ELSE
    UPDATE tags SET status = 'owned', activated_at = NOW() WHERE id = v_claim.tag_id;
  END IF;

  UPDATE ownership_claims
     SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_reviewed_by
   WHERE id = p_claim_id;

  RETURN QUERY SELECT v_owner_id, v_claim.tag_id;
END;
$$;

-- ── complete_transfer: now sets acquired_at = NOW() ─────────────────────────
CREATE OR REPLACE FUNCTION complete_transfer(p_transfer_id UUID)
RETURNS TABLE (new_owner_id UUID, old_owner_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t   transfer_requests%ROWTYPE;
  v_new UUID;
  v_pid UUID;
BEGIN
  SELECT * INTO v_t FROM transfer_requests WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND OR v_t.status <> 'awaiting_acceptance' THEN
    RETURN;  -- idempotent
  END IF;

  UPDATE ownership_records
     SET is_current = FALSE, ended_at = NOW()
   WHERE id = v_t.from_owner_id;

  INSERT INTO ownership_records
    (tag_id, owner_name, owner_email, acquisition_type, acquired_from_id, sale_price, currency, acquired_at, is_current)
  VALUES
    (v_t.tag_id, v_t.to_name, v_t.to_email, 'transfer', v_t.from_owner_id,
     v_t.sale_price, COALESCE(v_t.currency, 'NGN'), NOW(), TRUE)
  RETURNING id INTO v_new;

  -- Propagate `transferred` across the whole product group.
  SELECT product_id INTO v_pid FROM tags WHERE id = v_t.tag_id;
  IF v_pid IS NOT NULL THEN
    UPDATE tags SET status = 'transferred' WHERE product_id = v_pid;
  ELSE
    UPDATE tags SET status = 'transferred' WHERE id = v_t.tag_id;
  END IF;

  UPDATE transfer_requests
     SET status = 'completed', completed_at = NOW()
   WHERE id = p_transfer_id;

  RETURN QUERY SELECT v_new, v_t.from_owner_id;
END;
$$;

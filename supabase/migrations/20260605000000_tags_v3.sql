-- ============================================================
-- Tags v3 — scan URL stored at creation, pipeline timestamps,
-- and the tag/card medium split (+ batch type).
--
-- The 11→5 status collapse and the new CHECK already shipped in
-- 20260603000000_prd_v3_lifecycle.sql. This migration only adds the
-- additive columns introduced by the Tags/Cards update.
--
-- Idempotent & additive — no column drops. Safe to re-run.
-- ============================================================

-- ── 1. Persist the public scan URL on the tag itself ──
-- Previously the URL was derived on the fly from token + hmac_signature.
-- We now store it at creation so QR/print pipelines have a single source.
ALTER TABLE tags ADD COLUMN IF NOT EXISTS url TEXT;

-- Backfill any rows missing a URL from their existing token + signature.
UPDATE tags
   SET url = CONCAT('https://tagitlux.com/v/', token, '?sig=', hmac_signature)
 WHERE url IS NULL;

-- Every tag now has a URL, so make it required going forward.
ALTER TABLE tags ALTER COLUMN url SET NOT NULL;

-- ── 2. Pipeline timestamps ──
-- created_at and activated_at already exist; add the two shipping/live marks.
ALTER TABLE tags ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS live_at    TIMESTAMPTZ;

-- ── 3. Medium: a tag is an embedded inlay; a card is a standalone NFC card ──
ALTER TABLE tags ADD COLUMN IF NOT EXISTS
  medium TEXT NOT NULL DEFAULT 'tag'
  CHECK (medium IN ('tag', 'card'));

-- At most one card may be attached to a given product. Partial unique index
-- enforces it at the database level (the API also guards it for a clean 409).
CREATE UNIQUE INDEX IF NOT EXISTS tags_one_card_per_product
  ON tags (product_id)
  WHERE medium = 'card' AND product_id IS NOT NULL;

-- ── 4. Batches can be tags-only, cards-only, or mixed ──
ALTER TABLE tag_batches ADD COLUMN IF NOT EXISTS
  batch_type TEXT NOT NULL DEFAULT 'tags'
  CHECK (batch_type IN ('tags', 'cards', 'mixed'));

ALTER TABLE tag_batches ADD COLUMN IF NOT EXISTS
  cards_quantity INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- CHIP LIMITS — lifetime tag/card caps per plan
-- ═══════════════════════════════════════════════════════════════════════════
-- Limits are LIFETIME, not monthly. They never reset. A brand's running totals
-- (tags_ordered_total / cards_ordered_total) accumulate across the whole
-- subscription. NULL limit = unlimited (Bespoke; admin may set a per-brand
-- override instead). Minimum order is always 10 per type.
-- ═══════════════════════════════════════════════════════════════════════════

-- Plan-level lifetime limits (NULL = unlimited / set per brand).
ALTER TABLE plans ADD COLUMN IF NOT EXISTS tag_limit INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS card_limit INTEGER;

UPDATE plans SET tag_limit = 10, card_limit = 10 WHERE name = 'Marque';
UPDATE plans SET tag_limit = 30, card_limit = 30 WHERE name = 'Atelier';
UPDATE plans SET tag_limit = 70, card_limit = 70 WHERE name = 'Maison';
-- Bespoke stays NULL — admin sets a per-brand override.

-- Per-brand overrides + running lifetime totals.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tag_limit_override INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS card_limit_override INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tags_ordered_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cards_ordered_total INTEGER NOT NULL DEFAULT 0;

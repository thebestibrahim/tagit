-- ═══════════════════════════════════════════════════════════════════════════
-- TRANSFER LOCATION — country of previous vs new owner on resale transfers
-- ═══════════════════════════════════════════════════════════════════════════
-- from_country: captured when a transfer is initiated (the previous owner).
-- to_country:   captured when the new owner accepts.
-- Stored as 2-letter ISO country codes (from Vercel edge geo headers, derived
-- from IP — country level only). Mapped to full names at display time. Powers
-- the Resale Analytics location lists.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS from_country TEXT;
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS to_country TEXT;

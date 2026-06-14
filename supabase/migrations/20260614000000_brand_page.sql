-- Public brand page (tagitlux.com/[slug]).
--
-- Every approved brand can publish a minimal product showcase at a vanity
-- slug. These columns drive that page. They are read server-side through the
-- service-role client (same pattern as /v/[token] and /certificate/[id]), so
-- no public RLS read policy is added — anon never queries companies directly.
--
-- Additive only: existing rows default to page_enabled = FALSE (not published)
-- with a NULL slug, so nothing becomes publicly reachable until a brand opts in.
-- Idempotent — safe to re-run.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS page_bio TEXT,
  ADD COLUMN IF NOT EXISTS page_enabled BOOLEAN DEFAULT FALSE;

-- Partial unique index: enforce slug uniqueness only across brands that have
-- one set (NULLs are excluded so unpublished brands don't collide).
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug
  ON companies(slug) WHERE slug IS NOT NULL;

-- Multi-tag per product: invert the tag→product relationship.
-- Before: products.tag_id → tags.id  (one tag per product, enforced by FK + UNIQUE)
-- After:  tags.product_id → products.id  (many tags per product, nullable)

BEGIN;

-- 1. Add product_id to tags
ALTER TABLE tags ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 2. Backfill from existing products.tag_id
UPDATE tags t
SET product_id = p.id
FROM products p
WHERE p.tag_id = t.id;

-- 3. Index for efficient reverse-FK lookups
CREATE INDEX idx_tags_product_id ON tags(product_id);

-- 4. Drop the old column from products
ALTER TABLE products DROP COLUMN tag_id;

COMMIT;

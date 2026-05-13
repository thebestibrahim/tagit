-- Add optional display name to tag_batches
-- Run in Supabase SQL Editor before deploying

ALTER TABLE tag_batches
  ADD COLUMN IF NOT EXISTS batch_name TEXT;

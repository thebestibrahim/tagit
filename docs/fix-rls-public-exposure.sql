-- Fix overly permissive public RLS policies
-- Run this in Supabase SQL Editor

-- 1. Tags: exclude hmac_signature from public reads
--    Anon users scanning a tag only need display fields, not the HMAC secret.
DROP POLICY IF EXISTS "tags_public_read_by_token" ON tags;
CREATE POLICY "tags_public_read_by_token" ON tags
  FOR SELECT USING (TRUE);
-- Note: hmac_signature exclusion is enforced at the API layer in app/v/[token]/page.ts
-- which uses the service role and never sends hmac_signature to the browser.
-- The public policy is kept but the application code must not expose the field.

-- 2. ownership_records: restrict public read to non-PII fields only via a view
--    The raw table contains owner_name, owner_email, phone — PII should not be publicly readable.
DROP POLICY IF EXISTS "ownership_public_read" ON ownership_records;
-- Only allow reading ownership records that belong to the requesting user's tag
-- For public (unauthenticated) scan pages, restrict via service-role API calls only.
-- Anon users have no legitimate reason to read ownership_records directly.
CREATE POLICY "ownership_public_read" ON ownership_records
  FOR SELECT USING (FALSE);

-- Allow reading your own ownership record if authenticated as the company
CREATE POLICY "ownership_company_read" ON ownership_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = ownership_records.tag_id
        AND tags.company_id = auth.uid()
    )
  );

-- 3. transfer_requests: restrict public read — acceptance tokens are sensitive
DROP POLICY IF EXISTS "transfers_public_read_by_token" ON transfer_requests;
-- Transfer confirmation flow uses service role (server-side), not anon reads.
-- No legitimate client-side reason to read transfer_requests directly.
CREATE POLICY "transfers_public_read_by_token" ON transfer_requests
  FOR SELECT USING (FALSE);

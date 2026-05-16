-- Add signature_url column to companies
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- After running this SQL, also create a "signatures" storage bucket:
-- Dashboard > Storage > New bucket
-- Name: signatures
-- Public bucket: YES (so the PDF generator can fetch the image by URL)

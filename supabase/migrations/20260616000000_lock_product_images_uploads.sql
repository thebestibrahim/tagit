-- ============================================================
-- Lock product-image uploads to the server (service role) only.
--
-- Product photos used to be uploaded straight from the browser to the
-- product-images bucket using the authenticated brand's session. The bucket's
-- allowed_mime_types only checks the CLIENT-DECLARED content type, which is
-- trivially spoofable, so a disguised file (e.g. an executable or a
-- script-bearing SVG sent as image/png) could land in a public bucket.
--
-- Uploads now go through POST /api/company/products/upload-image, which sniffs
-- the real magic bytes before writing via the service role (service role
-- bypasses RLS). Dropping the public INSERT policy removes the only path that
-- skipped that validation. SELECT (public read) and own-folder DELETE are
-- unchanged so existing images still load and brands can still remove theirs.
-- ============================================================

drop policy if exists "Companies upload own images" on storage.objects;

-- Defence in depth: even a service-role write must still be a real image type.
-- (allowed_mime_types is enforced by the storage API for every writer.)
update storage.buckets
  set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
  where id = 'product-images';

-- ============================================================
-- Storage buckets — mirror production onto any env missing them
-- (staging was provisioned without storage buckets, so logo / product-image /
-- signature uploads failed there). Idempotent; a no-op where they already exist.
--
-- Upload paths:
--   logos, signatures  → uploaded server-side via the service role (admin
--                        client), so they bypass RLS and need no objects policy.
--   product-images     → uploaded directly by the authenticated brand from the
--                        browser, so it needs INSERT/SELECT/DELETE policies
--                        scoped to the brand's own folder (name = "<uid>/...").
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos',          'logos',          true, 3145728, null),
  ('product-images', 'product-images', true, 5242880,
     array['image/jpeg','image/png','image/webp','image/gif']),
  ('signatures',     'signatures',     true, null,    null)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- product-images object policies (mirror prod exactly)
drop policy if exists "Companies upload own images" on storage.objects;
create policy "Companies upload own images" on storage.objects
  for insert to public
  with check (
    bucket_id = 'product-images'
    and (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects
  for select to public
  using (bucket_id = 'product-images');

drop policy if exists "Companies delete own images" on storage.objects;
create policy "Companies delete own images" on storage.objects
  for delete to public
  using (
    bucket_id = 'product-images'
    and (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

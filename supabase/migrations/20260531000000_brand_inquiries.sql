create table if not exists public.brand_inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  company     text not null,
  phone       text,
  status      text not null default 'new' check (status in ('new', 'contacted', 'converted', 'declined')),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.brand_inquiries enable row level security;

-- Only service role / admin can read
create policy "service role full access"
  on public.brand_inquiries
  for all
  using (true)
  with check (true);

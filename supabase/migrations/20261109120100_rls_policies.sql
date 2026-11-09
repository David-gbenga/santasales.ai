-- Row Level Security (PRD §6, CLAUDE.md security rules).
--
-- Public (anon/authenticated) may only:
--   * read active products and gallery items
--   * insert analytics events
-- Everything else goes through server routes using the service-role key,
-- which bypasses RLS. Tables without a policy are closed to anon/authenticated.

alter table public.products      enable row level security;
alter table public.gallery_items enable row level security;
alter table public.generations   enable row level security;
alter table public.orders        enable row level security;
alter table public.events        enable row level security;
alter table public.ai_summaries  enable row level security;

-- Belt and braces: strip the broad default grants Supabase gives the API
-- roles, then grant back only what the policies below allow.
revoke all on public.products, public.gallery_items, public.generations,
              public.orders, public.events, public.ai_summaries
  from anon, authenticated;

-- products: read active rows only, and never the private file path.
grant select (id, slug, name, description, price_pence, currency, preview_image, active, created_at)
  on public.products to anon, authenticated;

create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (active);

-- gallery_items: read active rows only.
grant select on public.gallery_items to anon, authenticated;

create policy "Public can read active gallery items"
  on public.gallery_items for select
  to anon, authenticated
  using (active);

-- events: insert only (no select, update or delete).
grant insert (type, path, ref_id, referrer) on public.events to anon, authenticated;

create policy "Public can log analytics events"
  on public.events for insert
  to anon, authenticated
  with check (true);  -- column checks on the table enforce types and lengths

-- generations, orders, ai_summaries: no grants, no policies → service role only.

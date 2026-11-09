-- Core schema for the Christmas digital store (PRD §6).
-- Money is stored in pence (integers). Timestamps are UTC.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- products: digital downloads sold in the shop
-- ---------------------------------------------------------------------------
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name          text not null check (length(name) between 1 and 120),
  description   text not null default '' check (length(description) <= 4000),
  price_pence   integer not null check (price_pence > 0),
  currency      text not null default 'gbp' check (currency = lower(currency) and length(currency) = 3),
  file_path     text not null,          -- path inside the private "products" bucket
  preview_image text,                   -- public URL or path for the shop card image
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index products_active_idx on public.products (active, created_at desc);

-- ---------------------------------------------------------------------------
-- gallery_items: images linking out to external stores
-- ---------------------------------------------------------------------------
create table public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(title) between 1 and 160),
  image_url    text not null check (length(image_url) <= 2048),
  target_url   text not null check (target_url ~* '^https://' and length(target_url) <= 2048),
  is_affiliate boolean not null default false,
  sort         integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index gallery_items_active_sort_idx on public.gallery_items (active, sort);

-- ---------------------------------------------------------------------------
-- generations: AI card / lyrics jobs (created before payment, pay-first flow)
-- ---------------------------------------------------------------------------
create table public.generations (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('card', 'lyrics')),
  design_id   text check (design_id is null or length(design_id) <= 64),
  input       jsonb not null default '{}'::jsonb,
  output_text text check (output_text is null or length(output_text) <= 8000),
  png_path    text,                     -- private "generated" bucket
  pdf_path    text,                     -- private "generated" bucket
  photo_path  text,                     -- private "uploads" bucket (P1)
  regen_count integer not null default 0 check (regen_count between 0 and 3),
  locked      boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint generations_card_has_design check (kind <> 'card' or design_id is not null)
);

-- Finding uploaded photos to delete after 30 days (PRD A7).
create index generations_photo_created_idx on public.generations (created_at)
  where photo_path is not null;

-- ---------------------------------------------------------------------------
-- orders: written only by server routes / the Stripe webhook
-- ---------------------------------------------------------------------------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,   -- webhook upserts on this (idempotent)
  email             text check (email is null or length(email) <= 320),
  kind              text not null check (kind in ('product', 'card', 'lyrics')),
  product_id        uuid references public.products (id) on delete restrict,
  generation_id     uuid references public.generations (id) on delete restrict,
  amount_pence      integer not null check (amount_pence >= 0),
  tax_pence         integer not null default 0 check (tax_pence >= 0),
  currency          text not null default 'gbp',
  status            text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  -- Each order points at exactly the thing it paid for.
  constraint orders_kind_target check (
    (kind = 'product' and product_id is not null and generation_id is null)
    or (kind in ('card', 'lyrics') and generation_id is not null and product_id is null)
  ),
  constraint orders_paid_at check (status = 'pending' or paid_at is not null)
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_status_paid_idx on public.orders (status, paid_at desc);
create index orders_product_idx on public.orders (product_id) where product_id is not null;
-- One order per generation: a paid generation can't be bought twice.
create unique index orders_generation_uidx on public.orders (generation_id) where generation_id is not null;

-- ---------------------------------------------------------------------------
-- events: cookie-free analytics (anon may insert, never read)
-- ---------------------------------------------------------------------------
create table public.events (
  id         bigint generated always as identity primary key,
  type       text not null check (type in ('page_view', 'gallery_click', 'cta_click', 'checkout_start')),
  path       text not null check (length(path) <= 512),
  ref_id     text check (ref_id is null or length(ref_id) <= 128),
  referrer   text check (referrer is null or length(referrer) <= 1024),
  created_at timestamptz not null default now()
);

create index events_created_type_idx on public.events (created_at desc, type);
create index events_ref_idx on public.events (type, ref_id) where ref_id is not null;

-- ---------------------------------------------------------------------------
-- ai_summaries: admin dashboard performance summaries
-- ---------------------------------------------------------------------------
create table public.ai_summaries (
  id           uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end   date not null check (period_end >= period_start),
  text         text not null check (length(text) <= 20000),
  created_at   timestamptz not null default now()
);

create index ai_summaries_created_idx on public.ai_summaries (created_at desc);

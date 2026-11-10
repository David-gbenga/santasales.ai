-- Card designs live in the database, not in code (decision 2026-11-10,
-- PRD F4 / §6a): adding a design must not need a deploy.

create table public.card_designs (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 64),
  name            text not null check (length(name) between 1 and 80),
  background_path text not null check (length(background_path) <= 512),  -- path in the public "media" bucket
  -- Where and how the message is drawn on the 1500×2100 card, e.g.
  -- {"text":{"x":190,"y":500,"width":1120,"height":980},"align":"center",
  --  "font":"serif","color":"#eef3f7","accentColor":"#f2a541"}
  layout          jsonb not null check (jsonb_typeof(layout) = 'object'),
  sort            integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index card_designs_active_sort_idx on public.card_designs (active, sort);

-- Generations point at a design by slug; renaming a slug follows through,
-- and a design that has been used can't be deleted (set active = false).
alter table public.generations
  add constraint generations_design_fk
  foreign key (design_id) references public.card_designs (slug)
  on update cascade on delete restrict;

-- RLS: anyone may read active designs; only the service role writes.
alter table public.card_designs enable row level security;
revoke all on public.card_designs from anon, authenticated;
grant select on public.card_designs to anon, authenticated;

create policy "Public can read active card designs"
  on public.card_designs for select
  to anon, authenticated
  using (active);

-- Add-ons and gift links (decision 2026-11-10):
--   * song_audio      an ElevenLabs sung version of a finished lyrics order
--   * voice_greeting  an ElevenLabs spoken greeting attached to a card or song
--   * gift_shares     private links the buyer sends to the recipient
--
-- Add-ons are their own generations (and orders), linked to the card or
-- lyrics generation they belong to through parent_id.

-- generations: new kinds + parent link -------------------------------------
alter table public.generations drop constraint generations_kind_check;
alter table public.generations
  add constraint generations_kind_check
  check (kind in ('card', 'lyrics', 'song_audio', 'voice_greeting'));

alter table public.generations
  add column parent_id uuid references public.generations (id) on delete restrict;

-- Add-ons always have a parent; cards and lyrics never do.
alter table public.generations
  add constraint generations_addon_parent
  check ((kind in ('song_audio', 'voice_greeting')) = (parent_id is not null));

create index generations_parent_idx on public.generations (parent_id) where parent_id is not null;

-- orders: new kinds ----------------------------------------------------------
alter table public.orders drop constraint orders_kind_check;
alter table public.orders
  add constraint orders_kind_check
  check (kind in ('product', 'card', 'lyrics', 'song_audio', 'voice_greeting'));

alter table public.orders drop constraint orders_kind_target;
alter table public.orders
  add constraint orders_kind_target check (
    (kind = 'product' and product_id is not null and generation_id is null)
    or (kind <> 'product' and generation_id is not null and product_id is null)
  );

-- gift_shares ------------------------------------------------------------------
-- One link per card or lyrics generation. The token is the only key to the
-- page, so it's long and random; the buyer can switch the link off.
create table public.gift_shares (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique check (token ~ '^[A-Za-z0-9_-]{22,64}$'),
  generation_id uuid not null unique references public.generations (id) on delete cascade,
  note          text check (note is null or length(note) <= 300),
  revoked       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.gift_shares enable row level security;
revoke all on public.gift_shares from anon, authenticated;
-- No policies: the gift page and share routes use the service role.

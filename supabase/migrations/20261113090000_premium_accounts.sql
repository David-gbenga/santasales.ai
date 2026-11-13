-- GiftPost Premium: customer accounts and the £25 / 30-day subscription
-- (docs/SUBSCRIPTIONS.md). Additive only: no existing row changes meaning.
--
-- Every new table is closed to anon/authenticated (RLS on, no policies, no
-- grants). Server code reads them with the service role after verifying the
-- signed-in user with Supabase Auth, and only the Stripe webhook writes
-- subscription state, so nobody can change their own status or dates.

-- profiles -----------------------------------------------------------------
create table public.profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null default '' check (length(full_name) <= 80),
  stripe_customer_id text unique check (stripe_customer_id is null or stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- subscriptions ------------------------------------------------------------
-- A mirror of Stripe's subscription, refreshed from Stripe on every webhook.
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users (id) on delete set null,
  stripe_subscription_id text not null unique check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  stripe_customer_id     text not null,
  status                 text not null check (status in (
                           'incomplete', 'incomplete_expired', 'trialing', 'active',
                           'past_due', 'canceled', 'unpaid', 'paused')),
  price_id               text,
  current_period_start   timestamptz not null,
  current_period_end     timestamptz not null check (current_period_end > current_period_start),
  cancel_at_period_end   boolean not null default false,
  canceled_at            timestamptz,
  ended_at               timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id, current_period_end desc);
-- At most one live subscription per account (no accidental double billing).
create unique index subscriptions_one_live_per_user
  on public.subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due') and user_id is not null;

-- stripe_events: webhook idempotency ----------------------------------------
create table public.stripe_events (
  event_id     text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  type         text not null check (length(type) <= 100),
  processed_at timestamptz not null default now()
);

-- entitlement_usage: allowance used per billing period ----------------------
create table public.entitlement_usage (
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  period_start    timestamptz not null,
  kind            text not null check (kind in ('card', 'song', 'voice_greeting')),
  count           integer not null default 0 check (count >= 0),
  primary key (subscription_id, period_start, kind)
);

-- generations / orders: link subscriber work to accounts ---------------------
alter table public.generations
  add column user_id uuid references auth.users (id) on delete set null;
create index generations_user_idx on public.generations (user_id, created_at desc)
  where user_id is not null;

-- A premium order is a £0 "paid" row covered by a subscription, so the
-- existing rewrite, download, email and retention code works unchanged.
alter table public.orders
  add column source text not null default 'checkout' check (source in ('checkout', 'premium')),
  add column subscription_id uuid references public.subscriptions (id) on delete set null;
alter table public.orders
  add constraint orders_premium_shape check (
    source = 'checkout'
    or (amount_pence = 0 and kind <> 'product' and stripe_session_id like 'premium:%')
  );
create index orders_subscription_idx on public.orders (subscription_id) where subscription_id is not null;

-- account_events: audit trail ---------------------------------------------
create table public.account_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users (id) on delete set null,
  type       text not null check (type in (
               'signed_up', 'profile_updated', 'subscription_started', 'subscription_renewed',
               'subscription_updated', 'payment_failed', 'subscription_cancelled',
               'subscription_resumed', 'subscription_ended', 'allowance_used')),
  detail     jsonb not null default '{}'::jsonb check (pg_column_size(detail) <= 4000),
  created_at timestamptz not null default now()
);
create index account_events_user_idx on public.account_events (user_id, created_at desc);

-- Lock everything down ------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.stripe_events     enable row level security;
alter table public.entitlement_usage enable row level security;
alter table public.account_events    enable row level security;
revoke all on public.profiles, public.subscriptions, public.stripe_events,
              public.entitlement_usage, public.account_events
  from anon, authenticated;

-- entitlement_take -----------------------------------------------------------
/**
 * Uses one item of a subscriber's allowance, atomically. Returns the
 * subscription and period it was charged to, or no row when the account
 * has no live subscription or the allowance for this period is used up.
 * Access rule: status active/trialing and the paid period hasn't ended.
 */
create or replace function public.entitlement_take(p_user uuid, p_kind text, p_limit integer)
returns table (subscription_id uuid, period_start timestamptz, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
  new_count integer;
begin
  if p_limit < 1 then
    return;
  end if;
  select * into sub
  from public.subscriptions s
  where s.user_id = p_user
    and s.status in ('active', 'trialing')
    and s.current_period_end > now()
  order by s.current_period_end desc
  limit 1;
  if not found then
    return;
  end if;

  insert into public.entitlement_usage as u (subscription_id, period_start, kind, count)
  values (sub.id, sub.current_period_start, p_kind, 1)
  on conflict on constraint entitlement_usage_pkey
    do update set count = u.count + 1
    where u.count < p_limit
  returning u.count into new_count;

  if new_count is null or new_count > p_limit then
    return;
  end if;
  return query select sub.id, sub.current_period_start, new_count;
end;
$$;

/** Gives back an allowance item when making the item failed. */
create or replace function public.entitlement_release(p_subscription uuid, p_period_start timestamptz, p_kind text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.entitlement_usage
  set count = greatest(count - 1, 0)
  where subscription_id = p_subscription and period_start = p_period_start and kind = p_kind;
$$;

revoke execute on function public.entitlement_take(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.entitlement_release(uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.entitlement_take(uuid, text, integer) to service_role;
grant execute on function public.entitlement_release(uuid, timestamptz, text) to service_role;

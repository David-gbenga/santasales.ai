-- GiftPost Premium income for the admin dashboard (docs/SUBSCRIPTIONS.md).
-- One row per paid subscription invoice, written only by the Stripe
-- webhook (invoice.paid), so revenue figures include memberships. Premium
-- cards and songs themselves are £0 orders (orders.source = 'premium').

create table public.subscription_payments (
  stripe_invoice_id text primary key check (stripe_invoice_id ~ '^in_[A-Za-z0-9]+$'),
  subscription_id   uuid references public.subscriptions (id) on delete set null,
  amount_pence      integer not null check (amount_pence >= 0),
  currency          text not null default 'gbp' check (currency = lower(currency) and length(currency) = 3),
  billing_reason    text check (billing_reason is null or length(billing_reason) <= 40),
  livemode          boolean not null,
  paid_at           timestamptz not null,
  refunded_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index subscription_payments_paid_idx on public.subscription_payments (paid_at desc);

alter table public.subscription_payments enable row level security;
revoke all on public.subscription_payments from anon, authenticated;
-- No policies: only the service role (webhook, admin stats) touches it.

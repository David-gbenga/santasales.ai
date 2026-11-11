-- Order emails (customer agent "Susan"):
-- 1. A thank-you email goes out once per paid order from the Stripe webhook;
--    thankyou_sent_at records it so webhook retries don't send it twice.
-- 2. Visitors can ask Susan to resend their order links to their email.
--    order_email_take caps how often that can happen per visitor and per
--    address, so nobody can use it to flood someone's inbox.

alter table public.orders add column thankyou_sent_at timestamptz;

create table public.order_email_usage (
  key   text not null check (length(key) <= 128),
  day   date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (key, day)
);

alter table public.order_email_usage enable row level security;
revoke all on public.order_email_usage from anon, authenticated;
-- No policies: only the service role (server) touches this table.

/**
 * Records one use for `p_key` today and says whether it is within p_limit.
 * Atomic, so concurrent requests can't slip past. Old rows are removed as
 * part of normal use.
 */
create or replace function public.order_email_take(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.order_email_usage as u (key, day, count)
  values (p_key, current_date, 1)
  on conflict (key, day) do update set count = u.count + 1
  returning u.count into used;

  delete from public.order_email_usage where day < current_date - 2;

  return used <= p_limit;
end;
$$;

revoke execute on function public.order_email_take(text, integer) from public, anon, authenticated;
grant execute on function public.order_email_take(text, integer) to service_role;

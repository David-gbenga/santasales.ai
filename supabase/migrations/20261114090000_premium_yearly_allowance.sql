-- GiftPost Premium yearly plan (owner's decision 2026-11-14): £225 a year
-- with the same allowance as monthly, reset every 30 days.
--
-- The allowance is now counted per 30-day window inside the paid period,
-- starting at current_period_start. A monthly (30-day) plan has exactly one
-- window per payment, so monthly members are unaffected; a yearly plan gets
-- a fresh allowance every 30 days. Same arithmetic as allowanceWindow() in
-- lib/subscriptions.ts.

create or replace function public.entitlement_take(p_user uuid, p_kind text, p_limit integer)
returns table (subscription_id uuid, period_start timestamptz, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
  window_start timestamptz;
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

  window_start := sub.current_period_start
    + floor(greatest(extract(epoch from now() - sub.current_period_start), 0) / (30 * 86400))
      * interval '30 days';

  insert into public.entitlement_usage as u (subscription_id, period_start, kind, count)
  values (sub.id, window_start, p_kind, 1)
  on conflict on constraint entitlement_usage_pkey
    do update set count = u.count + 1
    where u.count < p_limit
  returning u.count into new_count;

  if new_count is null or new_count > p_limit then
    return;
  end if;
  return query select sub.id, window_start, new_count;
end;
$$;

revoke execute on function public.entitlement_take(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.entitlement_take(uuid, text, integer) to service_role;

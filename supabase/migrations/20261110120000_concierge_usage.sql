-- Rate limiting for the Gift Concierge chat (PRD F8): every message costs an
-- AI call, so cap messages per visitor per day and in total per day.
--
-- Visitors are identified only by a keyed hash of their IP address that
-- changes daily (computed in the app), so no raw IPs are stored. Rows older
-- than two days are removed as part of normal use.

create table public.concierge_usage (
  key   text not null check (length(key) <= 128),
  day   date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (key, day)
);

alter table public.concierge_usage enable row level security;
revoke all on public.concierge_usage from anon, authenticated;
-- No policies: only the service role (server) touches this table.

/**
 * Records one concierge message for `p_key` and says whether it is allowed:
 * true while the visitor is within p_visitor_limit and everyone together is
 * within p_global_limit today. Atomic, so concurrent requests can't slip past.
 */
create or replace function public.concierge_take(p_key text, p_visitor_limit integer, p_global_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used  integer;
  total integer;
begin
  insert into public.concierge_usage as u (key, day, count)
  values (p_key, current_date, 1)
  on conflict (key, day) do update set count = u.count + 1
  returning u.count into used;

  select coalesce(sum(count), 0) into total
  from public.concierge_usage
  where day = current_date;

  delete from public.concierge_usage where day < current_date - 2;

  return used <= p_visitor_limit and total <= p_global_limit;
end;
$$;

revoke execute on function public.concierge_take(text, integer, integer) from public, anon, authenticated;
grant execute on function public.concierge_take(text, integer, integer) to service_role;

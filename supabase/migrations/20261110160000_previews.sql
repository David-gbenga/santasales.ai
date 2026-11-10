-- Free previews before payment (decision 2026-11-10): cards and songs are
-- written (and a short sung clip recorded) before the buyer pays; downloads
-- unlock after payment. Supersedes "pay before generating" for the forms.

-- One free re-roll before payment (paid rewrites still use regen_count).
alter table public.generations
  add column free_rerolls integer not null default 0 check (free_rerolls between 0 and 1);

-- Short sung preview clip for songs, in the private "generated" bucket.
alter table public.generations
  add column preview_audio_path text check (preview_audio_path is null or length(preview_audio_path) <= 512);

-- Daily preview limits, separate from the concierge's, using the same
-- privacy approach (keyed, daily-rotating visitor hash; no raw IPs).
create table public.preview_usage (
  key   text not null check (length(key) <= 128),
  day   date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (key, day)
);

alter table public.preview_usage enable row level security;
revoke all on public.preview_usage from anon, authenticated;

create or replace function public.preview_take(p_key text, p_visitor_limit integer, p_global_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used  integer;
  total integer;
begin
  insert into public.preview_usage as u (key, day, count)
  values (p_key, current_date, 1)
  on conflict (key, day) do update set count = u.count + 1
  returning u.count into used;

  select coalesce(sum(count), 0) into total
  from public.preview_usage
  where day = current_date;

  delete from public.preview_usage where day < current_date - 2;

  return used <= p_visitor_limit and total <= p_global_limit;
end;
$$;

revoke execute on function public.preview_take(text, integer, integer) from public, anon, authenticated;
grant execute on function public.preview_take(text, integer, integer) to service_role;

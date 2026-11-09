-- RLS and constraint checks. Run ONLY against a local or throwaway database:
-- it inserts fixture rows. Usage (local stack via `supabase start`):
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_check.sql
-- Expect "failures = 0". Reset the local DB afterwards with `npx supabase db reset`.

\set ON_ERROR_STOP 1
\set QUIET 1

-- Fixture data, inserted as superuser (like the service role would).
insert into public.products (slug, name, price_pence, file_path, active)
values ('advent-calendar', 'Advent calendar', 400, 'advent.pdf', true),
       ('old-thing', 'Retired product', 100, 'old.pdf', false);
insert into public.gallery_items (title, image_url, target_url, is_affiliate, active)
values ('Mug', '/g/mug.jpg', 'https://example.com/mug', true, true),
       ('Hidden', '/g/h.jpg', 'https://example.com/h', false, false);
insert into public.generations (id, kind, design_id) values ('00000000-0000-0000-0000-000000000001', 'card', 'snowy');
insert into public.orders (stripe_session_id, email, kind, generation_id, amount_pence, status, paid_at)
values ('cs_test_1', 'buyer@example.com', 'card', '00000000-0000-0000-0000-000000000001', 299, 'paid', now());
insert into public.ai_summaries (period_start, period_end, text) values ('2026-11-01', '2026-11-07', 'ok');

create temp table results (test text, passed boolean);
grant all on results to anon, authenticated;

-- Helper: run a statement as a role; record whether it was allowed.
create or replace function pg_temp.try(test_name text, role_name text, stmt text, expect_ok boolean)
returns void language plpgsql as $$
declare ok boolean;
begin
  begin
    execute format('set local role %I', role_name);
    execute stmt;
    ok := true;
  exception when others then
    ok := false;
  end;
  reset role;
  insert into results values (test_name, ok = expect_ok);
end $$;

create or replace function pg_temp.count_as(role_name text, stmt text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute format('set local role %I', role_name);
  execute stmt into n;
  reset role;
  return n;
exception when others then
  reset role;
  return -1;
end $$;

begin;
-- products
insert into results values ('anon sees only active products',
  pg_temp.count_as('anon', 'select count(*) from public.products') = 1);
select pg_temp.try('anon can select public product columns', 'anon',
  'select id, slug, name, price_pence, preview_image from public.products', true);
select pg_temp.try('anon cannot read product file_path', 'anon',
  'select file_path from public.products', false);
select pg_temp.try('anon cannot insert products', 'anon',
  $q$insert into public.products (slug, name, price_pence, file_path) values ('x', 'x', 1, 'x')$q$, false);
select pg_temp.try('anon cannot update products', 'anon',
  'update public.products set price_pence = 1', false);

-- gallery
insert into results values ('anon sees only active gallery items',
  pg_temp.count_as('anon', 'select count(*) from public.gallery_items') = 1);
select pg_temp.try('anon cannot delete gallery items', 'anon',
  'delete from public.gallery_items', false);

-- private tables
select pg_temp.try('anon cannot read orders', 'anon', 'select * from public.orders', false);
select pg_temp.try('authenticated cannot read orders', 'authenticated', 'select * from public.orders', false);
select pg_temp.try('anon cannot insert orders', 'anon',
  $q$insert into public.orders (stripe_session_id, kind, product_id, amount_pence) select 'cs_x', 'product', id, 1 from public.products limit 1$q$, false);
select pg_temp.try('anon cannot read generations', 'anon', 'select * from public.generations', false);
select pg_temp.try('anon cannot read ai_summaries', 'anon', 'select * from public.ai_summaries', false);

-- events
select pg_temp.try('anon can insert a valid event', 'anon',
  $q$insert into public.events (type, path) values ('page_view', '/')$q$, true);
select pg_temp.try('anon cannot read events', 'anon', 'select * from public.events', false);
select pg_temp.try('anon cannot insert unknown event type', 'anon',
  $q$insert into public.events (type, path) values ('hack', '/')$q$, false);
select pg_temp.try('anon cannot insert oversized path', 'anon',
  $q$insert into public.events (type, path) values ('page_view', repeat('a', 600))$q$, false);
select pg_temp.try('anon cannot set event created_at', 'anon',
  $q$insert into public.events (type, path, created_at) values ('page_view', '/', '2000-01-01')$q$, false);
select pg_temp.try('anon cannot delete events', 'anon', 'delete from public.events', false);

-- service role
insert into results values ('service_role reads all orders',
  pg_temp.count_as('service_role', 'select count(*) from public.orders') = 1);

-- constraints
select pg_temp.try('order must match its kind', 'service_role',
  $q$insert into public.orders (stripe_session_id, kind, amount_pence) values ('cs_bad', 'product', 1)$q$, false);
select pg_temp.try('stripe_session_id is unique', 'service_role',
  $q$insert into public.orders (stripe_session_id, kind, generation_id, amount_pence) values ('cs_test_1', 'card', '00000000-0000-0000-0000-000000000001', 299)$q$, false);
select pg_temp.try('paid order needs paid_at', 'service_role',
  $q$update public.orders set paid_at = null where stripe_session_id = 'cs_test_1'$q$, false);
select pg_temp.try('regen_count capped at 3', 'service_role',
  $q$update public.generations set regen_count = 4$q$, false);
select pg_temp.try('card generation needs a design', 'service_role',
  $q$insert into public.generations (kind) values ('card')$q$, false);
select pg_temp.try('gallery target must be https', 'service_role',
  $q$insert into public.gallery_items (title, image_url, target_url) values ('x', 'x', 'javascript:alert(1)')$q$, false);
commit;

-- storage
insert into results
select 'three private buckets exist', count(*) = 3 and bool_and(not public)
from storage.buckets where id in ('products', 'generated', 'uploads');

\set QUIET 0
select test, case when passed then 'PASS' else 'FAIL' end as result from results;
select count(*) filter (where not passed) as failures, count(*) as total from results;

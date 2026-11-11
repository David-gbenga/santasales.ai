-- Sign-ups for the free AI engineering bootcamp (/bootcamp).
-- Written only by the server (service role) after validation and a
-- per-visitor rate limit; nobody else can read or write it.

create table public.bootcamp_registrations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 100),
  email       text not null check (length(email) between 3 and 320),
  experience  text not null check (experience in ('new', 'some', 'developer')),
  goal        text check (goal is null or length(goal) <= 500),
  created_at  timestamptz not null default now()
);

-- One registration per address (case-insensitive).
create unique index bootcamp_registrations_email_uidx on public.bootcamp_registrations (lower(email));
create index bootcamp_registrations_created_idx on public.bootcamp_registrations (created_at desc);

alter table public.bootcamp_registrations enable row level security;
revoke all on public.bootcamp_registrations from anon, authenticated;
-- No policies: only the service role (server) touches this table.

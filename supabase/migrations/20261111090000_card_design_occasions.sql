-- Cards for any occasion (decision 2026-11-11). Each design lists the
-- occasions it suits; an empty list means it suits every occasion. Keys
-- match lib/occasions.ts. The launch designs are all wintry, so they stay
-- Christmas-only.

alter table public.card_designs
  add column occasions text[] not null default '{}'
    check (
      cardinality(occasions) <= 20
      and occasions <@ array[
        'christmas', 'birthday', 'anniversary', 'wedding', 'valentines',
        'mothers_day', 'fathers_day', 'congratulations', 'graduation',
        'new_baby', 'thank_you', 'get_well', 'retirement', 'just_because'
      ]::text[]
    );

update public.card_designs
  set occasions = array['christmas']
  where slug in ('snowy-night', 'golden-baubles', 'holly-sprig', 'paper-village');

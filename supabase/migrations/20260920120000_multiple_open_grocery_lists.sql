-- Preserve all lists/items and existing RLS. Families may keep several lists open.
begin;

drop index public.grocery_lists_one_open_per_family_idx;
create index grocery_lists_open_family_idx
  on public.grocery_lists(family_id, created_at desc, id desc)
  where status = 'open';

commit;

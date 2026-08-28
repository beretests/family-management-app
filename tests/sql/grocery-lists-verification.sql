-- Phase 24 grocery list permissions and lifecycle verification. The transaction
-- is rolled back so local development data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('24111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase24-parent@example.com', 'test-only', now(), now(), now()),
  ('24222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase24-child@example.com', 'test-only', now(), now(), now()),
  ('24333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'phase24-outsider@example.com', 'test-only', now(), now(), now());

insert into public.profiles(id, display_name) values
  ('24111111-1111-4111-8111-111111111111', 'Phase 24 Parent'),
  ('24222222-2222-4222-8222-222222222222', 'Phase 24 Child'),
  ('24333333-3333-4333-8333-333333333333', 'Phase 24 Outsider');

insert into public.families(id, name, created_by_profile_id) values (
  '24444444-4444-4444-8444-444444444444',
  'Phase 24 Family',
  '24111111-1111-4111-8111-111111111111'
);

insert into public.families(id, name, created_by_profile_id) values (
  '24aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Phase 24 Other Family',
  '24333333-3333-4333-8333-333333333333'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('24555555-5555-4555-8555-555555555555', '24444444-4444-4444-8444-444444444444', '24111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('24666666-6666-4666-8666-666666666666', '24444444-4444-4444-8444-444444444444', '24222222-2222-4222-8222-222222222222', 'Child', 'child'),
  ('24bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '24aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '24333333-3333-4333-8333-333333333333', 'Other Parent', 'parent');

insert into public.grocery_catalog_items(
  id, family_id, name, created_by_member_id
) values (
  '24cccccc-cccc-4ccc-8ccc-cccccccccccc',
  '24aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Other family item',
  '24bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

set local role authenticated;
set local request.jwt.claim.sub = '24222222-2222-4222-8222-222222222222';

-- A child can contribute a reusable catalog item, start the open household
-- list, add an item, and check it off as themselves.
insert into public.grocery_catalog_items(
  id, family_id, name, category, created_by_member_id
) values (
  '24777777-7777-4777-8777-777777777777',
  '24444444-4444-4444-8444-444444444444',
  '  Green   Apples ',
  'Produce',
  '24666666-6666-4666-8666-666666666666'
);

insert into public.grocery_lists(
  id, family_id, name, created_by_member_id
) values (
  '24888888-8888-4888-8888-888888888888',
  '24444444-4444-4444-8444-444444444444',
  'Weekly groceries',
  '24666666-6666-4666-8666-666666666666'
);

insert into public.grocery_list_items(
  id, family_id, grocery_list_id, catalog_item_id, name_snapshot,
  category_snapshot, added_by_member_id
) values (
  '24999999-9999-4999-8999-999999999999',
  '24444444-4444-4444-8444-444444444444',
  '24888888-8888-4888-8888-888888888888',
  '24777777-7777-4777-8777-777777777777',
  'Green Apples',
  'Produce',
  '24666666-6666-4666-8666-666666666666'
);

-- Family-scoped foreign keys prevent a contributor from attaching another
-- family's catalog row even if its UUID becomes known.
do $$
begin
  begin
    insert into public.grocery_list_items(
      family_id, grocery_list_id, catalog_item_id, name_snapshot,
      added_by_member_id
    ) values (
      '24444444-4444-4444-8444-444444444444',
      '24888888-8888-4888-8888-888888888888',
      '24cccccc-cccc-4ccc-8ccc-cccccccccccc',
      'Cross-family item',
      '24666666-6666-4666-8666-666666666666'
    );
    raise exception 'cross-family catalog link unexpectedly succeeded';
  exception
    when foreign_key_violation then null;
  end;
end $$;

update public.grocery_list_items
set checked = true,
    checked_by_member_id = '24666666-6666-4666-8666-666666666666',
    checked_at = now()
where id = '24999999-9999-4999-8999-999999999999';

do $$
begin
  if not exists (
    select 1 from public.grocery_catalog_items
    where id = '24777777-7777-4777-8777-777777777777'
      and normalized_name = 'green apples'
  ) then
    raise exception 'catalog name normalization failed';
  end if;

  if not exists (
    select 1 from public.grocery_list_items
    where id = '24999999-9999-4999-8999-999999999999'
      and checked
      and checked_by_member_id = '24666666-6666-4666-8666-666666666666'
  ) then
    raise exception 'child grocery check-off failed';
  end if;
end $$;

-- Column grants prevent a contributor from rewriting immutable attribution or
-- item snapshot fields through the API.
do $$
begin
  begin
    update public.grocery_list_items
    set name_snapshot = 'Spoofed item'
    where id = '24999999-9999-4999-8999-999999999999';
    raise exception 'child unexpectedly rewrote a snapshot';
  exception
    when insufficient_privilege then null;
  end;
end $$;

-- A child cannot close or delete the whole list.
update public.grocery_lists
set status = 'archived',
    closed_at = now(),
    closed_by_member_id = '24666666-6666-4666-8666-666666666666',
    delete_after = now() + interval '90 days'
where id = '24888888-8888-4888-8888-888888888888';

delete from public.grocery_lists
where id = '24888888-8888-4888-8888-888888888888';

do $$
begin
  if not exists (
    select 1 from public.grocery_lists
    where id = '24888888-8888-4888-8888-888888888888'
      and status = 'open'
  ) then
    raise exception 'child unexpectedly managed the whole list';
  end if;
end $$;

-- A non-member cannot see the family's list.
set local request.jwt.claim.sub = '24333333-3333-4333-8333-333333333333';

do $$
begin
  if exists (
    select 1 from public.grocery_lists
    where family_id = '24444444-4444-4444-8444-444444444444'
  ) then
    raise exception 'outsider unexpectedly read a grocery list';
  end if;
end $$;

-- A parent can complete the list with a 90-day deletion timestamp, while a
-- second open list remains prevented by the partial unique index.
set local request.jwt.claim.sub = '24111111-1111-4111-8111-111111111111';

do $$
begin
  begin
    insert into public.grocery_lists(
      family_id, name, created_by_member_id
    ) values (
      '24444444-4444-4444-8444-444444444444',
      'Duplicate open list',
      '24555555-5555-4555-8555-555555555555'
    );
    raise exception 'duplicate open list unexpectedly succeeded';
  exception
    when unique_violation then null;
  end;
end $$;

update public.grocery_lists
set status = 'completed',
    closed_at = '2026-08-28T12:00:00Z',
    closed_by_member_id = '24555555-5555-4555-8555-555555555555',
    delete_after = '2026-11-26T12:00:00Z'
where id = '24888888-8888-4888-8888-888888888888';

do $$
begin
  if not exists (
    select 1 from public.grocery_lists
    where id = '24888888-8888-4888-8888-888888888888'
      and status = 'completed'
      and delete_after = '2026-11-26T12:00:00Z'
  ) then
    raise exception 'parent lifecycle or retention timestamp failed';
  end if;
end $$;

delete from public.grocery_lists
where id = '24888888-8888-4888-8888-888888888888';

do $$
begin
  if exists (
    select 1 from public.grocery_list_items
    where grocery_list_id = '24888888-8888-4888-8888-888888888888'
  ) then
    raise exception 'list item cascade cleanup failed';
  end if;

  if not exists (
    select 1 from public.grocery_catalog_items
    where id = '24777777-7777-4777-8777-777777777777'
  ) then
    raise exception 'reusable catalog item was deleted with list history';
  end if;
end $$;

rollback;

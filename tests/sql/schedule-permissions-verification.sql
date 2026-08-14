-- Phase 19 schedule permission verification. Every assertion runs in a
-- transaction and is rolled back, so local data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('19111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase19-parent@example.com', 'test-only', now(), now(), now()),
  ('19222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase19-child@example.com', 'test-only', now(), now(), now());

insert into public.profiles(id, display_name) values
  ('19111111-1111-4111-8111-111111111111', 'Phase 19 Parent'),
  ('19222222-2222-4222-8222-222222222222', 'Phase 19 Child');

insert into public.families(id, name, created_by_profile_id) values (
  '19333333-3333-4333-8333-333333333333',
  'Phase 19 Family',
  '19111111-1111-4111-8111-111111111111'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('19444444-4444-4444-8444-444444444444', '19333333-3333-4333-8333-333333333333', '19111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('19555555-5555-4555-8555-555555555555', '19333333-3333-4333-8333-333333333333', '19222222-2222-4222-8222-222222222222', 'Child', 'child'),
  ('19666666-6666-4666-8666-666666666666', '19333333-3333-4333-8333-333333333333', null, 'Sibling', 'child');

set local role authenticated;
set local request.jwt.claim.sub = '19222222-2222-4222-8222-222222222222';

-- A child may create and update a self-assigned event and its recurrence.
insert into public.schedule_events(
  id, family_id, member_id, created_by_member_id, event_type, title, starts_at, ends_at
) values (
  '19777777-7777-4777-8777-777777777777',
  '19333333-3333-4333-8333-333333333333',
  '19555555-5555-4555-8555-555555555555',
  '19555555-5555-4555-8555-555555555555',
  'extracurricular',
  'Child-created event',
  '2026-08-17T16:00:00Z',
  '2026-08-17T17:00:00Z'
);

insert into public.schedule_event_members(
  family_id, schedule_event_id, member_id
) values (
  '19333333-3333-4333-8333-333333333333',
  '19777777-7777-4777-8777-777777777777',
  '19555555-5555-4555-8555-555555555555'
);

insert into public.schedule_event_recurrences(
  event_id, family_id, frequency, weekdays, time_zone
) values (
  '19777777-7777-4777-8777-777777777777',
  '19333333-3333-4333-8333-333333333333',
  'weekly',
  array[1, 2, 3, 4, 5]::smallint[],
  'America/Regina'
);

update public.schedule_events
set title = 'Child-updated event'
where id = '19777777-7777-4777-8777-777777777777';

-- A child may not assign an event to a sibling.
do $$
begin
  begin
    insert into public.schedule_events(
      family_id, member_id, created_by_member_id, event_type, title, starts_at, ends_at
    ) values (
      '19333333-3333-4333-8333-333333333333',
      '19666666-6666-4666-8666-666666666666',
      '19555555-5555-4555-8555-555555555555',
      'school',
      'Forbidden sibling event',
      '2026-08-18T16:00:00Z',
      '2026-08-18T17:00:00Z'
    );
    raise exception 'child sibling assignment unexpectedly succeeded';
  exception
    when insufficient_privilege or check_violation then null;
  end;
end $$;

-- No non-parent DELETE policy exists: the row must remain.
delete from public.schedule_events
where id = '19777777-7777-4777-8777-777777777777';

do $$
begin
  if not exists (
    select 1 from public.schedule_events
    where id = '19777777-7777-4777-8777-777777777777'
  ) then
    raise exception 'child unexpectedly deleted a schedule event';
  end if;
end $$;

-- A parent can delete the same event (and recurrence cascades).
set local request.jwt.claim.sub = '19111111-1111-4111-8111-111111111111';
delete from public.schedule_events
where id = '19777777-7777-4777-8777-777777777777';

do $$
begin
  if exists (
    select 1 from public.schedule_events
    where id = '19777777-7777-4777-8777-777777777777'
  ) then
    raise exception 'parent could not delete a schedule event';
  end if;
end $$;

rollback;

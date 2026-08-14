-- Phase 20 ICS import verification. The transaction is rolled back so local
-- development data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('20111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase20-parent@example.com', 'test-only', now(), now(), now()),
  ('20222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase20-child@example.com', 'test-only', now(), now(), now());

insert into public.profiles(id, display_name) values
  ('20111111-1111-4111-8111-111111111111', 'Phase 20 Parent'),
  ('20222222-2222-4222-8222-222222222222', 'Phase 20 Child');

insert into public.families(id, name, created_by_profile_id) values (
  '20333333-3333-4333-8333-333333333333',
  'Phase 20 Family',
  '20111111-1111-4111-8111-111111111111'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('20444444-4444-4444-8444-444444444444', '20333333-3333-4333-8333-333333333333', '20111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('20555555-5555-4555-8555-555555555555', '20333333-3333-4333-8333-333333333333', '20222222-2222-4222-8222-222222222222', 'Child', 'child'),
  ('20666666-6666-4666-8666-666666666666', '20333333-3333-4333-8333-333333333333', null, 'Sibling', 'child');

set local role authenticated;
set local request.jwt.claim.sub = '20222222-2222-4222-8222-222222222222';

-- A child can atomically import an event to their own calendar.
select public.import_schedule_event(
  '20777777-7777-4777-8777-777777777777',
  '20333333-3333-4333-8333-333333333333',
  array['20555555-5555-4555-8555-555555555555']::uuid[],
  '20555555-5555-4555-8555-555555555555',
  'extracurricular',
  'Imported child event',
  'Bring water',
  '2026-08-17T18:00:00Z',
  '2026-08-17T19:00:00Z',
  false,
  'Community field',
  null,
  'child-event@example.test',
  'child-calendar.ics',
  'weekly',
  1::smallint,
  array[1, 2, 3, 4, 5]::smallint[],
  null,
  10,
  'America/Regina'
);

do $$
begin
  if not exists (
    select 1
    from public.schedule_events se
    join public.schedule_event_members sem on sem.schedule_event_id = se.id
    join public.schedule_event_recurrences ser on ser.event_id = se.id
    where se.id = '20777777-7777-4777-8777-777777777777'
      and se.import_uid = 'child-event@example.test'
      and se.imported_at is not null
      and sem.member_id = '20555555-5555-4555-8555-555555555555'
      and ser.weekdays = array[1, 2, 3, 4, 5]::smallint[]
  ) then
    raise exception 'self ICS import did not create all atomic rows';
  end if;
end $$;

-- The family/UID pair is idempotent.
do $$
begin
  begin
    perform public.import_schedule_event(
      '20888888-8888-4888-8888-888888888888',
      '20333333-3333-4333-8333-333333333333',
      array['20555555-5555-4555-8555-555555555555']::uuid[],
      '20555555-5555-4555-8555-555555555555',
      'extracurricular',
      'Duplicate child event',
      null,
      '2026-08-18T18:00:00Z',
      '2026-08-18T19:00:00Z',
      false,
      null,
      null,
      'child-event@example.test',
      'child-calendar.ics',
      null,
      null,
      '{}'::smallint[],
      null,
      null,
      null
    );
    raise exception 'duplicate ICS UID unexpectedly succeeded';
  exception
    when unique_violation then null;
  end;
end $$;

-- A child cannot import to a sibling, and the failed function leaves no event.
do $$
begin
  begin
    perform public.import_schedule_event(
      '20999999-9999-4999-8999-999999999999',
      '20333333-3333-4333-8333-333333333333',
      array['20666666-6666-4666-8666-666666666666']::uuid[],
      '20555555-5555-4555-8555-555555555555',
      'school',
      'Forbidden sibling import',
      null,
      '2026-08-19T18:00:00Z',
      '2026-08-19T19:00:00Z',
      false,
      null,
      null,
      'sibling-event@example.test',
      'child-calendar.ics',
      null,
      null,
      '{}'::smallint[],
      null,
      null,
      null
    );
    raise exception 'child sibling ICS import unexpectedly succeeded';
  exception
    when insufficient_privilege or check_violation then null;
  end;

  if exists (
    select 1 from public.schedule_events
    where id = '20999999-9999-4999-8999-999999999999'
  ) then
    raise exception 'failed sibling import left a partial event';
  end if;
end $$;

-- Parents can import a whole-family event (represented by no member rows).
set local request.jwt.claim.sub = '20111111-1111-4111-8111-111111111111';

select public.import_schedule_event(
  '20aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '20333333-3333-4333-8333-333333333333',
  '{}'::uuid[],
  '20444444-4444-4444-8444-444444444444',
  'family_event',
  'Whole-family import',
  null,
  '2026-08-20T18:00:00Z',
  '2026-08-20T19:00:00Z',
  false,
  null,
  null,
  'family-event@example.test',
  'family-calendar.ics',
  null,
  null,
  '{}'::smallint[],
  null,
  null,
  null
);

do $$
begin
  if not exists (
    select 1 from public.schedule_events
    where id = '20aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and member_id is null
  ) or exists (
    select 1 from public.schedule_event_members
    where schedule_event_id = '20aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) then
    raise exception 'whole-family ICS import was not represented correctly';
  end if;
end $$;

rollback;

-- Phase 22 recurring-occurrence and scope verification. All data rolls back.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('22111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase22-parent@example.com', 'test-only', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase22-child@example.com', 'test-only', now(), now(), now());

insert into public.profiles(id, display_name) values
  ('22111111-1111-4111-8111-111111111111', 'Phase 22 Parent'),
  ('22222222-2222-4222-8222-222222222222', 'Phase 22 Child');

insert into public.families(id, name, created_by_profile_id) values (
  '22333333-3333-4333-8333-333333333333',
  'Phase 22 Family',
  '22111111-1111-4111-8111-111111111111'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('22444444-4444-4444-8444-444444444444', '22333333-3333-4333-8333-333333333333', '22111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('22555555-5555-4555-8555-555555555555', '22333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'Child', 'child');

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

insert into public.schedule_events(
  id, family_id, member_id, created_by_member_id, event_type, title, starts_at, ends_at
) values (
  '22666666-6666-4666-8666-666666666666',
  '22333333-3333-4333-8333-333333333333',
  '22555555-5555-4555-8555-555555555555',
  '22555555-5555-4555-8555-555555555555',
  'extracurricular',
  'Practice',
  '2026-08-17T22:00:00Z',
  '2026-08-17T23:00:00Z'
);

insert into public.schedule_event_members(family_id, schedule_event_id, member_id)
values (
  '22333333-3333-4333-8333-333333333333',
  '22666666-6666-4666-8666-666666666666',
  '22555555-5555-4555-8555-555555555555'
);

insert into public.schedule_event_recurrences(
  event_id, family_id, frequency, occurrence_count, time_zone
) values (
  '22666666-6666-4666-8666-666666666666',
  '22333333-3333-4333-8333-333333333333',
  'weekly',
  10,
  'America/Regina'
);

-- A child can modify one occurrence of a self-created series.
select public.upsert_schedule_occurrence_override(
  '22333333-3333-4333-8333-333333333333',
  '22666666-6666-4666-8666-666666666666',
  '2026-08-24',
  '22555555-5555-4555-8555-555555555555',
  'modified',
  jsonb_build_object(
    'event_type', 'extracurricular',
    'title', 'Moved practice',
    'description', null,
    'starts_at', '2026-08-25T00:00:00Z',
    'ends_at', '2026-08-25T01:00:00Z',
    'all_day', false,
    'location', null,
    'color', null
  ),
  array['22555555-5555-4555-8555-555555555555']::uuid[]
);

-- A child cannot cancel an occurrence through the RPC.
do $$
begin
  begin
    perform public.upsert_schedule_occurrence_override(
      '22333333-3333-4333-8333-333333333333',
      '22666666-6666-4666-8666-666666666666',
      '2026-08-31',
      '22555555-5555-4555-8555-555555555555',
      'cancelled',
      null,
      '{}'::uuid[]
    );
    raise exception 'child occurrence deletion unexpectedly succeeded';
  exception
    when insufficient_privilege or raise_exception then
      if sqlerrm = 'child occurrence deletion unexpectedly succeeded' then
        raise;
      end if;
  end;
end $$;

select public.upsert_schedule_occurrence_override(
  '22333333-3333-4333-8333-333333333333',
  '22666666-6666-4666-8666-666666666666',
  '2026-08-31',
  '22555555-5555-4555-8555-555555555555',
  'modified',
  jsonb_build_object(
    'event_type', 'extracurricular',
    'title', 'Future exception',
    'description', null,
    'starts_at', '2026-08-31T23:00:00Z',
    'ends_at', '2026-09-01T00:00:00Z',
    'all_day', false,
    'location', null,
    'color', null
  ),
  array['22555555-5555-4555-8555-555555555555']::uuid[]
);

set local request.jwt.claim.sub = '22111111-1111-4111-8111-111111111111';

-- Splitting preserves the earlier series and moves applicable overrides.
select public.split_schedule_event_series(
  '22333333-3333-4333-8333-333333333333',
  '22666666-6666-4666-8666-666666666666',
  '2026-08-24',
  '22777777-7777-4777-8777-777777777777',
  '22444444-4444-4444-8444-444444444444',
  jsonb_build_object(
    'event_type', 'extracurricular',
    'title', 'Later practice',
    'description', null,
    'starts_at', '2026-08-24T22:00:00Z',
    'ends_at', '2026-08-24T23:00:00Z',
    'all_day', false,
    'location', null,
    'color', null
  ),
  jsonb_build_object(
    'frequency', 'weekly',
    'interval_count', 1,
    'weekdays', jsonb_build_array(),
    'ends_on', null,
    'occurrence_count', 9,
    'time_zone', 'America/Regina'
  ),
  array['22555555-5555-4555-8555-555555555555']::uuid[]
);

do $$
begin
  if not exists (
    select 1 from public.schedule_event_recurrences
    where event_id = '22666666-6666-4666-8666-666666666666'
      and ends_on = '2026-08-23'
      and occurrence_count is null
  ) then
    raise exception 'earlier series was not truncated before the split';
  end if;

  if exists (
    select 1 from public.schedule_event_occurrence_overrides
    where occurrence_date = '2026-08-24'
  ) then
    raise exception 'split occurrence override was not replaced by new series data';
  end if;

  if not exists (
    select 1 from public.schedule_event_occurrence_overrides
    where series_event_id = '22777777-7777-4777-8777-777777777777'
      and occurrence_date = '2026-08-31'
  ) then
    raise exception 'later override was not moved to the new series';
  end if;
end $$;

select public.truncate_schedule_event_series(
  '22333333-3333-4333-8333-333333333333',
  '22777777-7777-4777-8777-777777777777',
  '2026-08-31'
);

rollback;

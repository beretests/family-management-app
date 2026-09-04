-- Phase 31 schedule create idempotency verification. The transaction is
-- rolled back so local development data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('31111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase31-parent@example.com', 'test-only', now(), now(), now()),
  ('31222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase31-child@example.com', 'test-only', now(), now(), now());

insert into public.profiles(id, display_name) values
  ('31111111-1111-4111-8111-111111111111', 'Phase 31 Parent'),
  ('31222222-2222-4222-8222-222222222222', 'Phase 31 Child');

insert into public.families(id, name, created_by_profile_id) values (
  '31333333-3333-4333-8333-333333333333',
  'Phase 31 Family',
  '31111111-1111-4111-8111-111111111111'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('31444444-4444-4444-8444-444444444444', '31333333-3333-4333-8333-333333333333', '31111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('31555555-5555-4555-8555-555555555555', '31333333-3333-4333-8333-333333333333', '31222222-2222-4222-8222-222222222222', 'Child', 'child');

insert into public.schedule_events(
  id, family_id, member_id, created_by_member_id, event_type, title,
  starts_at, ends_at, idempotency_key
) values (
  '31666666-6666-4666-8666-666666666666',
  '31333333-3333-4333-8333-333333333333',
  '31444444-4444-4444-8444-444444444444',
  '31444444-4444-4444-8444-444444444444',
  'family_event',
  'Original request',
  '2026-09-12T20:30:00Z',
  '2026-09-12T21:30:00Z',
  '31777777-7777-4777-8777-777777777777'
);

do $$
begin
  begin
    insert into public.schedule_events(
      family_id, member_id, created_by_member_id, event_type, title,
      starts_at, ends_at, idempotency_key
    ) values (
      '31333333-3333-4333-8333-333333333333',
      '31444444-4444-4444-8444-444444444444',
      '31444444-4444-4444-8444-444444444444',
      'family_event',
      'Duplicate request',
      '2026-09-12T20:30:00Z',
      '2026-09-12T21:30:00Z',
      '31777777-7777-4777-8777-777777777777'
    );
    raise exception 'duplicate schedule request unexpectedly succeeded';
  exception
    when unique_violation then null;
  end;
end $$;

-- The same random key is scoped to its creator, not the entire family.
insert into public.schedule_events(
  family_id, member_id, created_by_member_id, event_type, title,
  starts_at, ends_at, idempotency_key
) values (
  '31333333-3333-4333-8333-333333333333',
  '31555555-5555-4555-8555-555555555555',
  '31555555-5555-4555-8555-555555555555',
  'extracurricular',
  'Independent child request',
  '2026-09-12T22:00:00Z',
  '2026-09-12T23:00:00Z',
  '31777777-7777-4777-8777-777777777777'
);

do $$
begin
  if (
    select count(*)
    from public.schedule_events
    where family_id = '31333333-3333-4333-8333-333333333333'
      and idempotency_key = '31777777-7777-4777-8777-777777777777'
  ) <> 2 then
    raise exception 'creator-scoped schedule idempotency failed';
  end if;
end $$;

rollback;

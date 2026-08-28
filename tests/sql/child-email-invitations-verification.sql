-- Phase 26 child email invitation, linking, and revocation verification. The
-- transaction is rolled back so local development data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values
  ('26111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase26-parent@example.com', 'test-only', now(), '{"user_name":"Phase 26 Parent","user_role":"parent"}', now(), now()),
  ('26222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase26-child@example.com', 'test-only', now(), '{"user_name":"Phase 26 Child","user_role":"parent"}', now(), now()),
  ('26333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'phase26-outsider@example.com', 'test-only', now(), '{"user_name":"Phase 26 Outsider","user_role":"parent"}', now(), now());

insert into public.profiles(id, display_name) values
  ('26111111-1111-4111-8111-111111111111', 'Phase 26 Parent'),
  ('26222222-2222-4222-8222-222222222222', 'Phase 26 Child'),
  ('26333333-3333-4333-8333-333333333333', 'Phase 26 Outsider');

insert into public.families(id, name, created_by_profile_id) values (
  '26444444-4444-4444-8444-444444444444',
  'Phase 26 Family',
  '26111111-1111-4111-8111-111111111111'
);

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('26555555-5555-4555-8555-555555555555', '26444444-4444-4444-8444-444444444444', '26111111-1111-4111-8111-111111111111', 'Parent', 'parent'),
  ('26666666-6666-4666-8666-666666666666', '26444444-4444-4444-8444-444444444444', null, 'Child', 'child');

set local role authenticated;
set local request.jwt.claim.sub = '26111111-1111-4111-8111-111111111111';

insert into public.family_child_invitations(
  id, family_id, member_id, email_normalized, invited_by_member_id
) values (
  '26777777-7777-4777-8777-777777777777',
  '26444444-4444-4444-8444-444444444444',
  '26666666-6666-4666-8666-666666666666',
  'phase26-child@example.com',
  '26555555-5555-4555-8555-555555555555'
);

-- A child or outsider cannot read or mutate a parent's pending invitation.
set local request.jwt.claim.sub = '26333333-3333-4333-8333-333333333333';

do $$
begin
  if exists (
    select 1 from public.family_child_invitations
    where id = '26777777-7777-4777-8777-777777777777'
  ) then
    raise exception 'outsider unexpectedly read a child invitation';
  end if;
end $$;

-- Acceptance is server-only, validates the exact auth email, and atomically
-- connects the existing child profile rather than creating another member.
reset role;

select * from public.accept_child_email_invitation(
  '26777777-7777-4777-8777-777777777777',
  '26222222-2222-4222-8222-222222222222'
);

do $$
begin
  if not exists (
    select 1 from public.family_members
    where id = '26666666-6666-4666-8666-666666666666'
      and profile_id = '26222222-2222-4222-8222-222222222222'
      and lifecycle_status = 'active'
  ) then
    raise exception 'existing child profile was not connected';
  end if;

  if not exists (
    select 1 from public.family_member_auth_links
    where member_id = '26666666-6666-4666-8666-666666666666'
      and profile_id = '26222222-2222-4222-8222-222222222222'
      and revoked_at is null
  ) then
    raise exception 'active child auth link was not recorded';
  end if;

  if not exists (
    select 1 from public.family_child_invitations
    where id = '26777777-7777-4777-8777-777777777777'
      and status = 'accepted'
      and email_normalized is null
  ) then
    raise exception 'accepted invitation did not scrub its email';
  end if;

  if (select count(*) from public.family_members
      where family_id = '26444444-4444-4444-8444-444444444444'
        and role = 'child') <> 1 then
    raise exception 'acceptance duplicated the child profile';
  end if;
end $$;

-- The linked child is recognized through normal family membership RLS.
set local role authenticated;
set local request.jwt.claim.sub = '26222222-2222-4222-8222-222222222222';

do $$
begin
  if not exists (
    select 1 from public.families
    where id = '26444444-4444-4444-8444-444444444444'
  ) then
    raise exception 'linked child could not read the family';
  end if;
end $$;

-- Parent disconnect revokes account access but preserves the active child and
-- its history. It does not delete the Supabase Auth user.
set local request.jwt.claim.sub = '26111111-1111-4111-8111-111111111111';

select public.disconnect_child_email_account(
  '26444444-4444-4444-8444-444444444444',
  '26666666-6666-4666-8666-666666666666'
);

do $$
begin
  if not exists (
    select 1 from public.family_members
    where id = '26666666-6666-4666-8666-666666666666'
      and profile_id is null
      and lifecycle_status = 'active'
  ) then
    raise exception 'disconnect changed or removed the child profile';
  end if;

  if exists (
    select 1 from public.family_member_auth_links
    where member_id = '26666666-6666-4666-8666-666666666666'
      and revoked_at is null
  ) then
    raise exception 'disconnect left an active auth link';
  end if;

end $$;

reset role;

do $$
begin
  if not exists (
    select 1 from auth.users
    where id = '26222222-2222-4222-8222-222222222222'
  ) then
    raise exception 'disconnect unexpectedly deleted the auth user';
  end if;
end $$;

rollback;

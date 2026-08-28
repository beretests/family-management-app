-- Phase 28 existing-account child linking verification. The transaction is
-- rolled back so local development data is preserved.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values
  ('28111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'phase28-parent@example.com', 'test-only', now(), '{"user_name":"Phase 28 Parent","user_role":"parent"}', now(), now()),
  ('28222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'phase28-existing@example.com', 'test-only', now(), '{"user_name":"Phase 28 Existing","user_role":"child"}', now(), now()),
  ('28333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'phase28-occupied@example.com', 'test-only', now(), '{"user_name":"Phase 28 Occupied","user_role":"parent"}', now(), now());

insert into public.profiles(id, display_name) values
  ('28111111-1111-4111-8111-111111111111', 'Phase 28 Parent'),
  ('28222222-2222-4222-8222-222222222222', 'Phase 28 Existing'),
  ('28333333-3333-4333-8333-333333333333', 'Phase 28 Occupied');

insert into public.families(id, name, created_by_profile_id) values
  ('28444444-4444-4444-8444-444444444444', 'Phase 28 Target Family', '28111111-1111-4111-8111-111111111111'),
  ('28444444-4444-4444-8444-444444444445', 'Phase 28 Occupied Family', '28333333-3333-4333-8333-333333333333');

insert into public.family_members(
  id, family_id, profile_id, display_name, role
) values
  ('28555555-5555-4555-8555-555555555555', '28444444-4444-4444-8444-444444444444', '28111111-1111-4111-8111-111111111111', 'Target Parent', 'parent'),
  ('28666666-6666-4666-8666-666666666666', '28444444-4444-4444-8444-444444444444', null, 'Existing Account Child', 'child'),
  ('28666666-6666-4666-8666-666666666667', '28444444-4444-4444-8444-444444444444', null, 'Occupied Account Child', 'child'),
  ('28666666-6666-4666-8666-666666666668', '28444444-4444-4444-8444-444444444444', null, 'Revoked Invite Child', 'child'),
  ('28666666-6666-4666-8666-666666666669', '28444444-4444-4444-8444-444444444444', null, 'Expired Invite Child', 'child'),
  ('28555555-5555-4555-8555-555555555557', '28444444-4444-4444-8444-444444444445', '28333333-3333-4333-8333-333333333333', 'Occupied Parent', 'parent');

-- The account-status lookup is server-only and distinguishes an unlinked
-- confirmed account, an occupied account, and an unknown address.
do $$
declare
  existing_status record;
  occupied_status record;
begin
  if has_function_privilege(
    'authenticated',
    'public.get_child_link_account_status(text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated unexpectedly executes account lookup';
  end if;

  select * into existing_status
  from public.get_child_link_account_status('phase28-existing@example.com');

  if existing_status.profile_id <> '28222222-2222-4222-8222-222222222222'
    or not existing_status.email_confirmed
    or existing_status.has_active_family_access then
    raise exception 'unlinked existing account status was incorrect';
  end if;

  select * into occupied_status
  from public.get_child_link_account_status('phase28-occupied@example.com');

  if occupied_status.profile_id <> '28333333-3333-4333-8333-333333333333'
    or not occupied_status.email_confirmed
    or not occupied_status.has_active_family_access then
    raise exception 'occupied account status was incorrect';
  end if;

  if exists (
    select 1
    from public.get_child_link_account_status('phase28-unknown@example.com')
  ) then
    raise exception 'unknown email unexpectedly resolved to an Auth user';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '28111111-1111-4111-8111-111111111111';

-- Browser-scoped parent access cannot choose existing-account mode. It may
-- create only the default new-account row; the server promotes it after the
-- auth.users lookup.
do $$
declare
  blocked boolean := false;
begin
  begin
    insert into public.family_child_invitations(
      id, family_id, member_id, email_normalized, account_mode,
      invited_by_member_id
    ) values (
      '28777777-7777-4777-8777-777777777779',
      '28444444-4444-4444-8444-444444444444',
      '28666666-6666-4666-8666-666666666666',
      'phase28-existing@example.com',
      'existing_account',
      '28555555-5555-4555-8555-555555555555'
    );
  exception when insufficient_privilege or check_violation then
    blocked := true;
  end;

  if not blocked then
    raise exception 'parent unexpectedly selected existing-account mode';
  end if;
end $$;

insert into public.family_child_invitations(
  id, family_id, member_id, email_normalized, invited_by_member_id
) values (
  '28777777-7777-4777-8777-777777777777',
  '28444444-4444-4444-8444-444444444444',
  '28666666-6666-4666-8666-666666666666',
  'phase28-existing@example.com',
  '28555555-5555-4555-8555-555555555555'
);

do $$
begin
  if not exists (
    select 1
    from public.family_child_invitations
    where id = '28777777-7777-4777-8777-777777777777'
      and account_mode = 'new_account'
  ) then
    raise exception 'new invitation did not use the safe default mode';
  end if;
end $$;

reset role;

update public.family_child_invitations
set account_mode = 'existing_account'
where id = '28777777-7777-4777-8777-777777777777';

select * from public.accept_child_email_invitation(
  '28777777-7777-4777-8777-777777777777',
  '28222222-2222-4222-8222-222222222222'
);

do $$
begin
  if not exists (
    select 1
    from public.family_members
    where id = '28666666-6666-4666-8666-666666666666'
      and profile_id = '28222222-2222-4222-8222-222222222222'
  ) then
    raise exception 'existing account was not connected to target child';
  end if;

  if not exists (
    select 1
    from public.family_child_invitations
    where id = '28777777-7777-4777-8777-777777777777'
      and account_mode = 'existing_account'
      and status = 'accepted'
      and email_normalized is null
  ) then
    raise exception 'existing-account invitation was not accepted and scrubbed';
  end if;
end $$;

insert into public.family_child_invitations(
  id, family_id, member_id, email_normalized, account_mode,
  invited_by_member_id
) values (
  '28777777-7777-4777-8777-777777777778',
  '28444444-4444-4444-8444-444444444444',
  '28666666-6666-4666-8666-666666666667',
  'phase28-occupied@example.com',
  'existing_account',
  '28555555-5555-4555-8555-555555555555'
);

-- Exact-email, revoked, and expired boundaries remain enforced for the new
-- account mode before any family link can change.
do $$
begin
  begin
    perform * from public.accept_child_email_invitation(
      '28777777-7777-4777-8777-777777777778',
      '28222222-2222-4222-8222-222222222222'
    );
    raise exception 'wrong-email account was unexpectedly accepted';
  exception when others then
    if position('Sign in with the invited email address' in sqlerrm) = 0 then
      raise;
    end if;
  end;
end $$;

insert into public.family_child_invitations(
  id, family_id, member_id, email_normalized, account_mode, status,
  invited_by_member_id, revoked_at
) values (
  '28777777-7777-4777-8777-777777777780',
  '28444444-4444-4444-8444-444444444444',
  '28666666-6666-4666-8666-666666666668',
  null,
  'existing_account',
  'revoked',
  '28555555-5555-4555-8555-555555555555',
  now()
);

insert into public.family_child_invitations(
  id, family_id, member_id, email_normalized, account_mode,
  invited_by_member_id, expires_at
) values (
  '28777777-7777-4777-8777-777777777781',
  '28444444-4444-4444-8444-444444444444',
  '28666666-6666-4666-8666-666666666669',
  'phase28-expired@example.com',
  'existing_account',
  '28555555-5555-4555-8555-555555555555',
  now() - interval '1 minute'
);

do $$
begin
  begin
    perform * from public.accept_child_email_invitation(
      '28777777-7777-4777-8777-777777777780',
      '28222222-2222-4222-8222-222222222222'
    );
    raise exception 'revoked invitation was unexpectedly accepted';
  exception when others then
    if position('no longer pending' in sqlerrm) = 0 then
      raise;
    end if;
  end;

  begin
    perform * from public.accept_child_email_invitation(
      '28777777-7777-4777-8777-777777777781',
      '28222222-2222-4222-8222-222222222222'
    );
    raise exception 'expired invitation was unexpectedly accepted';
  exception when others then
    if position('expired' in sqlerrm) = 0 then
      raise;
    end if;
  end;
end $$;

do $$
begin
  begin
    perform * from public.accept_child_email_invitation(
      '28777777-7777-4777-8777-777777777778',
      '28333333-3333-4333-8333-333333333333'
    );
    raise exception 'occupied account was unexpectedly accepted';
  exception when others then
    if position('active family access' in sqlerrm) = 0 then
      raise;
    end if;
  end;

  if exists (
    select 1
    from public.family_members
    where id = '28666666-6666-4666-8666-666666666667'
      and profile_id is not null
  ) then
    raise exception 'rejected occupied account changed the target child';
  end if;

  if not exists (
    select 1
    from public.family_child_invitations
    where id = '28777777-7777-4777-8777-777777777778'
      and status = 'pending'
  ) then
    raise exception 'rejected occupied invitation changed state';
  end if;
end $$;

rollback;

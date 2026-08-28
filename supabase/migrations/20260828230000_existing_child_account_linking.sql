alter table public.family_child_invitations
  add column account_mode text not null default 'new_account';

alter table public.family_child_invitations
  add constraint family_child_invitations_account_mode_check
  check (account_mode in ('new_account', 'existing_account'));

comment on column public.family_child_invitations.account_mode is
  'Controls whether acceptance creates a password for an invited Auth user or preserves an existing account password.';

-- Parent-scoped inserts always begin as new-account invitations. Only the
-- reviewed server flow can promote a row to existing_account after a
-- server-only auth.users lookup confirms the account.
drop policy family_child_invitations_insert_parent
  on public.family_child_invitations;

create policy family_child_invitations_insert_parent
  on public.family_child_invitations for insert to authenticated
  with check (
    status = 'pending'
    and account_mode = 'new_account'
    and invited_by_member_id = any(public.current_user_member_ids(family_id))
    and public.current_user_has_family_role(
      family_id,
      array['parent']::public.family_role[]
    )
    and exists (
      select 1
      from public.family_members fm
      where fm.id = member_id
        and fm.family_id = family_child_invitations.family_id
        and fm.role = 'child'
        and fm.lifecycle_status = 'active'
        and fm.profile_id is null
    )
  );

-- This lookup is intentionally service-role-only because it reads auth.users
-- by email. Parent-facing responses remain neutral and never return the mode.
create or replace function public.get_child_link_account_status(
  p_email_normalized text
)
returns table(
  profile_id uuid,
  email_confirmed boolean,
  has_active_family_access boolean
)
language sql
security definer
set search_path = public, auth
as $$
  select
    auth_user.id,
    auth_user.email_confirmed_at is not null,
    exists (
      select 1
      from public.family_members direct_member
      where direct_member.profile_id = auth_user.id
        and direct_member.lifecycle_status = 'active'
    ) or exists (
      select 1
      from public.family_member_auth_links auth_link
      join public.family_members linked_member
        on linked_member.family_id = auth_link.family_id
       and linked_member.id = auth_link.member_id
      where auth_link.profile_id = auth_user.id
        and auth_link.revoked_at is null
        and linked_member.lifecycle_status = 'active'
    )
  from auth.users auth_user
  where lower(btrim(auth_user.email)) = lower(btrim(p_email_normalized))
  limit 1;
$$;

-- Acceptance performs the membership check again while the invitation and
-- target member are locked. This closes the race between sending the email and
-- the user accepting it, and keeps the current one-family MVP unambiguous.
create or replace function public.accept_child_email_invitation(
  p_invitation_id uuid,
  p_profile_id uuid
)
returns table(accepted_family_id uuid, accepted_member_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation_row public.family_child_invitations%rowtype;
  member_row public.family_members%rowtype;
  authenticated_email text;
begin
  select *
  into invitation_row
  from public.family_child_invitations
  where id = p_invitation_id
  for update;

  if invitation_row.id is null then
    raise exception 'Child invitation not found.';
  end if;

  if invitation_row.status <> 'pending' then
    raise exception 'This child invitation is no longer pending.';
  end if;

  if invitation_row.expires_at < now() then
    raise exception 'This child invitation has expired.';
  end if;

  select lower(btrim(email))
  into authenticated_email
  from auth.users
  where id = p_profile_id;

  if authenticated_email is null
    or authenticated_email <> invitation_row.email_normalized then
    raise exception 'Sign in with the invited email address.';
  end if;

  select *
  into member_row
  from public.family_members
  where id = invitation_row.member_id
    and family_id = invitation_row.family_id
  for update;

  if member_row.id is null
    or member_row.role <> 'child'
    or member_row.lifecycle_status <> 'active' then
    raise exception 'The invited child profile is not active.';
  end if;

  if member_row.profile_id is not null
    and member_row.profile_id <> p_profile_id then
    raise exception 'This child profile already has a connected account.';
  end if;

  if exists (
    select 1
    from public.family_members existing_member
    where existing_member.profile_id = p_profile_id
      and existing_member.lifecycle_status = 'active'
  ) or exists (
    select 1
    from public.family_member_auth_links existing_link
    join public.family_members linked_member
      on linked_member.family_id = existing_link.family_id
     and linked_member.id = existing_link.member_id
    where existing_link.profile_id = p_profile_id
      and existing_link.revoked_at is null
      and linked_member.lifecycle_status = 'active'
  ) then
    raise exception 'This account already has active family access.';
  end if;

  update public.family_members
  set profile_id = p_profile_id,
      updated_at = now()
  where id = invitation_row.member_id
    and family_id = invitation_row.family_id;

  insert into public.family_member_auth_links (
    family_id,
    member_id,
    profile_id,
    created_by_member_id,
    revoked_at
  ) values (
    invitation_row.family_id,
    invitation_row.member_id,
    p_profile_id,
    invitation_row.invited_by_member_id,
    null
  )
  on conflict (family_id, member_id, profile_id)
  do update set revoked_at = null;

  update public.family_child_invitations
  set status = 'accepted',
      email_normalized = null,
      accepted_by_profile_id = p_profile_id,
      accepted_at = now(),
      updated_at = now()
  where id = invitation_row.id;

  insert into public.audit_events (
    family_id,
    actor_member_id,
    event_type,
    target_table,
    target_id,
    metadata
  ) values (
    invitation_row.family_id,
    invitation_row.member_id,
    'family_child_email.accepted',
    'family_members',
    invitation_row.member_id,
    jsonb_build_object(
      'invitation_id', invitation_row.id,
      'account_mode', invitation_row.account_mode
    )
  );

  return query
  select invitation_row.family_id, invitation_row.member_id;
end;
$$;

revoke all on function public.get_child_link_account_status(text) from public;
revoke all on function public.get_child_link_account_status(text)
  from anon, authenticated;
revoke all on function public.accept_child_email_invitation(uuid, uuid)
  from public;
revoke all on function public.accept_child_email_invitation(uuid, uuid)
  from anon, authenticated;

grant execute on function public.get_child_link_account_status(text)
  to service_role;
grant execute on function public.accept_child_email_invitation(uuid, uuid)
  to service_role;

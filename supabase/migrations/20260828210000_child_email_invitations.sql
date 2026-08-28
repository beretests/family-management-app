create table public.family_child_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null,
  email_normalized text,
  status public.family_invitation_status not null default 'pending',
  invited_by_member_id uuid,
  accepted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  unique (id, family_id),
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade,
  foreign key (invited_by_member_id, family_id)
    references public.family_members(id, family_id)
    on delete set null (invited_by_member_id),
  check (
    (status = 'pending'
      and email_normalized is not null
      and email_normalized = lower(email_normalized)
      and email_normalized = btrim(email_normalized)
      and char_length(email_normalized) between 3 and 254
      and accepted_by_profile_id is null
      and accepted_at is null
      and revoked_at is null)
    or
    (status = 'accepted'
      and email_normalized is null
      and accepted_by_profile_id is not null
      and accepted_at is not null
      and revoked_at is null)
    or
    (status = 'revoked'
      and email_normalized is null
      and revoked_at is not null)
    or
    (status = 'expired'
      and email_normalized is null
      and accepted_by_profile_id is null
      and accepted_at is null)
  )
);

create unique index family_child_invitations_pending_member_idx
  on public.family_child_invitations(family_id, member_id)
  where status = 'pending';

create unique index family_child_invitations_pending_email_idx
  on public.family_child_invitations(family_id, email_normalized)
  where status = 'pending';

create index family_child_invitations_family_status_idx
  on public.family_child_invitations(family_id, status, created_at desc);

create unique index family_member_auth_links_one_active_member_idx
  on public.family_member_auth_links(family_id, member_id)
  where revoked_at is null;

create unique index family_member_auth_links_one_active_profile_idx
  on public.family_member_auth_links(family_id, profile_id)
  where revoked_at is null;

create trigger family_child_invitations_set_updated_at
  before update on public.family_child_invitations
  for each row execute function public.set_updated_at();

alter table public.family_child_invitations enable row level security;

revoke all on table public.family_child_invitations from anon, authenticated;
grant select, insert on table public.family_child_invitations to authenticated;
grant update (status, email_normalized, revoked_at, updated_at)
  on table public.family_child_invitations to authenticated;

create policy family_child_invitations_select_parent
  on public.family_child_invitations for select to authenticated
  using (
    public.current_user_has_family_role(
      family_id,
      array['parent']::public.family_role[]
    )
  );

create policy family_child_invitations_insert_parent
  on public.family_child_invitations for insert to authenticated
  with check (
    status = 'pending'
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

create policy family_child_invitations_revoke_parent
  on public.family_child_invitations for update to authenticated
  using (
    status = 'pending'
    and public.current_user_has_family_role(
      family_id,
      array['parent']::public.family_role[]
    )
  )
  with check (
    status = 'revoked'
    and email_normalized is null
    and revoked_at is not null
    and public.current_user_has_family_role(
      family_id,
      array['parent']::public.family_role[]
    )
  );

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
    from public.family_members fm
    where fm.family_id = invitation_row.family_id
      and fm.profile_id = p_profile_id
      and fm.id <> invitation_row.member_id
  ) or exists (
    select 1
    from public.family_member_auth_links fmal
    where fmal.family_id = invitation_row.family_id
      and fmal.profile_id = p_profile_id
      and fmal.member_id <> invitation_row.member_id
      and fmal.revoked_at is null
  ) then
    raise exception 'This account is already linked to another family member.';
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
    jsonb_build_object('invitation_id', invitation_row.id)
  );

  return query
  select invitation_row.family_id, invitation_row.member_id;
end;
$$;

create or replace function public.disconnect_child_email_account(
  p_family_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_row public.family_members%rowtype;
  actor_member_id uuid;
  disconnected_at timestamptz := now();
begin
  if not public.current_user_has_family_role(
    p_family_id,
    array['parent']::public.family_role[]
  ) then
    raise exception 'Only an active parent can disconnect a child account.';
  end if;

  actor_member_id := (public.current_user_member_ids(p_family_id))[1];

  select *
  into member_row
  from public.family_members
  where id = p_member_id
    and family_id = p_family_id
    and role = 'child'
  for update;

  if member_row.id is null then
    raise exception 'Child profile not found.';
  end if;

  update public.family_member_auth_links
  set revoked_at = disconnected_at
  where family_id = p_family_id
    and member_id = p_member_id
    and revoked_at is null;

  update public.family_members
  set profile_id = null,
      updated_at = disconnected_at
  where family_id = p_family_id
    and id = p_member_id;

  update public.family_child_invitations
  set status = 'revoked',
      email_normalized = null,
      revoked_at = disconnected_at,
      updated_at = disconnected_at
  where family_id = p_family_id
    and member_id = p_member_id
    and status in ('pending', 'accepted');

  insert into public.audit_events (
    family_id,
    actor_member_id,
    event_type,
    target_table,
    target_id,
    metadata
  ) values (
    p_family_id,
    actor_member_id,
    'family_child_email.disconnected',
    'family_members',
    p_member_id,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.accept_child_email_invitation(uuid, uuid) from public;
revoke all on function public.disconnect_child_email_account(uuid, uuid) from public;

grant execute on function public.accept_child_email_invitation(uuid, uuid)
  to service_role;
grant execute on function public.disconnect_child_email_account(uuid, uuid)
  to authenticated;

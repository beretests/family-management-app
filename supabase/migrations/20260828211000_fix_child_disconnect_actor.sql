-- Keep parent account disconnection compatible with PostgreSQL 15, which does
-- not provide min(uuid). This replacement is also safe after a clean migration
-- run and keeps the operation atomic.
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

revoke all on function public.disconnect_child_email_account(uuid, uuid)
  from public;
grant execute on function public.disconnect_child_email_account(uuid, uuid)
  to authenticated;

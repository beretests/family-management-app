do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'family_invitation_status'
  ) then
    create type public.family_invitation_status as enum (
      'pending',
      'accepted',
      'revoked',
      'expired'
    );
  end if;
end $$;

create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null,
  email_normalized text not null check (
    email_normalized = lower(email_normalized)
    and email_normalized = btrim(email_normalized)
    and char_length(email_normalized) between 3 and 254
  ),
  role public.family_role not null check (role in ('parent', 'caregiver')),
  status public.family_invitation_status not null default 'pending',
  invited_by_member_id uuid references public.family_members(id) on delete set null,
  accepted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create index if not exists family_invitations_family_status_idx
  on public.family_invitations(family_id, status, created_at);

create unique index if not exists family_invitations_pending_email_idx
  on public.family_invitations(family_id, email_normalized)
  where status = 'pending';

drop trigger if exists family_invitations_set_updated_at on public.family_invitations;
create trigger family_invitations_set_updated_at before update on public.family_invitations
  for each row execute function public.set_updated_at();

alter table public.family_invitations enable row level security;

drop policy if exists family_invitations_select_parent on public.family_invitations;
create policy family_invitations_select_parent on public.family_invitations
  for select to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

drop policy if exists family_invitations_manage_parent on public.family_invitations;
create policy family_invitations_manage_parent on public.family_invitations
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

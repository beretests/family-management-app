create table public.family_member_pin_credentials (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  member_id uuid not null,
  pin_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_member_id uuid references public.family_members(id) on delete set null,
  unique (member_id),
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create trigger family_member_pin_credentials_set_updated_at
  before update on public.family_member_pin_credentials
  for each row execute function public.set_updated_at();

create index family_member_pin_credentials_family_id_idx
  on public.family_member_pin_credentials(family_id);

alter table public.family_member_pin_credentials enable row level security;

create policy family_member_pin_credentials_select_parent
  on public.family_member_pin_credentials
  for select to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy family_member_pin_credentials_manage_parent
  on public.family_member_pin_credentials
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

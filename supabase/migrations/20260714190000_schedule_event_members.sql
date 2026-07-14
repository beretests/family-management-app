alter type public.schedule_event_type add value if not exists 'parent_away';
alter type public.schedule_event_type add value if not exists 'parent_activity';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedule_events_id_family_id_key'
  ) then
    alter table public.schedule_events
      add constraint schedule_events_id_family_id_key unique (id, family_id);
  end if;
end $$;

create table if not exists public.schedule_event_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  schedule_event_id uuid not null,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_event_id, member_id),
  foreign key (schedule_event_id, family_id)
    references public.schedule_events(id, family_id)
    on delete cascade,
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create trigger schedule_event_members_set_updated_at
  before update on public.schedule_event_members
  for each row execute function public.set_updated_at();

create index if not exists schedule_event_members_family_id_idx
  on public.schedule_event_members(family_id);

create index if not exists schedule_event_members_member_id_idx
  on public.schedule_event_members(member_id);

create index if not exists schedule_event_members_event_id_idx
  on public.schedule_event_members(schedule_event_id);

insert into public.schedule_event_members(family_id, schedule_event_id, member_id)
select family_id, id, member_id
from public.schedule_events
where member_id is not null
on conflict (schedule_event_id, member_id) do nothing;

alter table public.schedule_event_members enable row level security;

create policy schedule_event_members_select_family
  on public.schedule_event_members
  for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy schedule_event_members_manage_parent
  on public.schedule_event_members
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

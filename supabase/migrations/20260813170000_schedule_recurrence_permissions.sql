create type public.schedule_recurrence_frequency as enum ('daily', 'weekly', 'yearly');

create table public.schedule_event_recurrences (
  event_id uuid primary key,
  family_id uuid not null,
  frequency public.schedule_recurrence_frequency not null,
  interval_count smallint not null default 1 check (interval_count between 1 and 365),
  weekdays smallint[] not null default '{}'::smallint[],
  ends_on date,
  occurrence_count integer check (occurrence_count between 1 and 1000),
  time_zone text not null default 'UTC' check (char_length(time_zone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (event_id, family_id)
    references public.schedule_events(id, family_id)
    on delete cascade,
  check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  check (cardinality(weekdays) <= 7),
  check (ends_on is null or occurrence_count is null)
);

create trigger schedule_event_recurrences_set_updated_at
  before update on public.schedule_event_recurrences
  for each row execute function public.set_updated_at();

create index schedule_event_recurrences_family_id_idx
  on public.schedule_event_recurrences(family_id);

create index schedule_event_recurrences_ends_on_idx
  on public.schedule_event_recurrences(family_id, ends_on);

alter table public.schedule_event_recurrences enable row level security;

drop policy if exists schedule_events_insert_own_extracurricular
  on public.schedule_events;
drop policy if exists schedule_events_update_own_extracurricular
  on public.schedule_events;

create policy schedule_events_insert_own
  on public.schedule_events
  for insert to authenticated
  with check (
    created_by_member_id = any(public.current_user_member_ids(family_id))
    and member_id = created_by_member_id
  );

create policy schedule_events_update_own
  on public.schedule_events
  for update to authenticated
  using (
    created_by_member_id = any(public.current_user_member_ids(family_id))
    and member_id = created_by_member_id
  )
  with check (
    created_by_member_id = any(public.current_user_member_ids(family_id))
    and member_id = created_by_member_id
  );

create policy schedule_event_members_insert_own
  on public.schedule_event_members
  for insert to authenticated
  with check (
    member_id = any(public.current_user_member_ids(family_id))
    and exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_members.schedule_event_id
        and se.family_id = schedule_event_members.family_id
        and se.created_by_member_id = schedule_event_members.member_id
    )
  );

create policy schedule_event_members_delete_own
  on public.schedule_event_members
  for delete to authenticated
  using (
    member_id = any(public.current_user_member_ids(family_id))
    and exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_members.schedule_event_id
        and se.family_id = schedule_event_members.family_id
        and se.created_by_member_id = schedule_event_members.member_id
    )
  );

create policy schedule_event_recurrences_select_family
  on public.schedule_event_recurrences
  for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy schedule_event_recurrences_manage_parent
  on public.schedule_event_recurrences
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy schedule_event_recurrences_insert_own
  on public.schedule_event_recurrences
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_recurrences.event_id
        and se.family_id = schedule_event_recurrences.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_recurrences.family_id))
        and se.member_id = se.created_by_member_id
    )
  );

create policy schedule_event_recurrences_update_own
  on public.schedule_event_recurrences
  for update to authenticated
  using (
    exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_recurrences.event_id
        and se.family_id = schedule_event_recurrences.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_recurrences.family_id))
        and se.member_id = se.created_by_member_id
    )
  )
  with check (
    exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_recurrences.event_id
        and se.family_id = schedule_event_recurrences.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_recurrences.family_id))
        and se.member_id = se.created_by_member_id
    )
  );

create policy schedule_event_recurrences_delete_own
  on public.schedule_event_recurrences
  for delete to authenticated
  using (
    exists (
      select 1
      from public.schedule_events se
      where se.id = schedule_event_recurrences.event_id
        and se.family_id = schedule_event_recurrences.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_recurrences.family_id))
        and se.member_id = se.created_by_member_id
    )
  );

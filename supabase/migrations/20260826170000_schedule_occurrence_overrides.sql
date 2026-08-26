create type public.schedule_occurrence_override_status as enum ('modified', 'cancelled');

create table public.schedule_event_occurrence_overrides (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  series_event_id uuid not null,
  occurrence_date date not null,
  status public.schedule_occurrence_override_status not null,
  created_by_member_id uuid not null,
  event_type public.schedule_event_type,
  title text check (title is null or char_length(title) between 1 and 140),
  description text check (description is null or char_length(description) <= 500),
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean,
  location text check (location is null or char_length(location) <= 160),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id),
  unique (series_event_id, occurrence_date),
  foreign key (series_event_id, family_id)
    references public.schedule_events(id, family_id)
    on delete cascade,
  foreign key (created_by_member_id, family_id)
    references public.family_members(id, family_id),
  check (
    status = 'cancelled'
    or (
      event_type is not null
      and title is not null
      and starts_at is not null
      and ends_at is not null
      and ends_at > starts_at
      and all_day is not null
    )
  )
);

create trigger schedule_event_occurrence_overrides_set_updated_at
  before update on public.schedule_event_occurrence_overrides
  for each row execute function public.set_updated_at();

create index schedule_event_occurrence_overrides_family_series_idx
  on public.schedule_event_occurrence_overrides(family_id, series_event_id);

create index schedule_event_occurrence_overrides_current_time_idx
  on public.schedule_event_occurrence_overrides(family_id, starts_at, ends_at)
  where status = 'modified';

create table public.schedule_event_occurrence_override_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  override_id uuid not null,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  unique (override_id, member_id),
  foreign key (override_id, family_id)
    references public.schedule_event_occurrence_overrides(id, family_id)
    on delete cascade,
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create index schedule_event_occurrence_override_members_family_idx
  on public.schedule_event_occurrence_override_members(family_id, override_id);

alter table public.schedule_event_occurrence_overrides enable row level security;
alter table public.schedule_event_occurrence_override_members enable row level security;

create policy schedule_occurrence_overrides_select_family
  on public.schedule_event_occurrence_overrides
  for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy schedule_occurrence_overrides_manage_parent
  on public.schedule_event_occurrence_overrides
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy schedule_occurrence_overrides_manage_own
  on public.schedule_event_occurrence_overrides
  for all to authenticated
  using (
    exists (
      select 1 from public.schedule_events se
      where se.id = schedule_event_occurrence_overrides.series_event_id
        and se.family_id = schedule_event_occurrence_overrides.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_occurrence_overrides.family_id))
        and se.member_id = se.created_by_member_id
    )
  )
  with check (
    schedule_event_occurrence_overrides.status = 'modified'
    and
    schedule_event_occurrence_overrides.created_by_member_id = any(public.current_user_member_ids(schedule_event_occurrence_overrides.family_id))
    and exists (
      select 1 from public.schedule_events se
      where se.id = schedule_event_occurrence_overrides.series_event_id
        and se.family_id = schedule_event_occurrence_overrides.family_id
        and se.created_by_member_id = schedule_event_occurrence_overrides.created_by_member_id
        and se.member_id = se.created_by_member_id
    )
  );

create policy schedule_occurrence_override_members_select_family
  on public.schedule_event_occurrence_override_members
  for select to authenticated
  using (public.current_user_is_family_member(family_id));

create policy schedule_occurrence_override_members_manage_parent
  on public.schedule_event_occurrence_override_members
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy schedule_occurrence_override_members_manage_own
  on public.schedule_event_occurrence_override_members
  for all to authenticated
  using (
    exists (
      select 1
      from public.schedule_event_occurrence_overrides seo
      join public.schedule_events se
        on se.id = seo.series_event_id and se.family_id = seo.family_id
      where seo.id = schedule_event_occurrence_override_members.override_id
        and seo.family_id = schedule_event_occurrence_override_members.family_id
        and se.created_by_member_id = any(public.current_user_member_ids(schedule_event_occurrence_override_members.family_id))
        and se.member_id = se.created_by_member_id
    )
  )
  with check (
    schedule_event_occurrence_override_members.member_id = any(public.current_user_member_ids(schedule_event_occurrence_override_members.family_id))
    and exists (
      select 1
      from public.schedule_event_occurrence_overrides seo
      join public.schedule_events se
        on se.id = seo.series_event_id and se.family_id = seo.family_id
      where seo.id = schedule_event_occurrence_override_members.override_id
        and seo.family_id = schedule_event_occurrence_override_members.family_id
        and se.created_by_member_id = schedule_event_occurrence_override_members.member_id
        and se.member_id = se.created_by_member_id
    )
  );

create or replace function public.upsert_schedule_occurrence_override(
  p_family_id uuid,
  p_series_event_id uuid,
  p_occurrence_date date,
  p_actor_member_id uuid,
  p_status public.schedule_occurrence_override_status,
  p_event jsonb default null,
  p_member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_override_id uuid;
begin
  if p_status = 'cancelled'
    and auth.role() <> 'service_role'
    and not public.current_user_has_family_role(
      p_family_id,
      array['parent']::public.family_role[]
    )
  then
    raise exception 'Only a parent can delete schedule events.';
  end if;

  insert into public.schedule_event_occurrence_overrides (
    family_id, series_event_id, occurrence_date, status, created_by_member_id,
    event_type, title, description, starts_at, ends_at, all_day, location, color
  ) values (
    p_family_id,
    p_series_event_id,
    p_occurrence_date,
    p_status,
    p_actor_member_id,
    case when p_status = 'modified' then (p_event->>'event_type')::public.schedule_event_type end,
    case when p_status = 'modified' then p_event->>'title' end,
    case when p_status = 'modified' then p_event->>'description' end,
    case when p_status = 'modified' then (p_event->>'starts_at')::timestamptz end,
    case when p_status = 'modified' then (p_event->>'ends_at')::timestamptz end,
    case when p_status = 'modified' then (p_event->>'all_day')::boolean end,
    case when p_status = 'modified' then p_event->>'location' end,
    case when p_status = 'modified' then p_event->>'color' end
  )
  on conflict (series_event_id, occurrence_date) do update set
    status = excluded.status,
    created_by_member_id = excluded.created_by_member_id,
    event_type = excluded.event_type,
    title = excluded.title,
    description = excluded.description,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    all_day = excluded.all_day,
    location = excluded.location,
    color = excluded.color
  returning id into v_override_id;

  delete from public.schedule_event_occurrence_override_members
  where family_id = p_family_id and override_id = v_override_id;

  if p_status = 'modified' then
    insert into public.schedule_event_occurrence_override_members (
      family_id, override_id, member_id
    )
    select p_family_id, v_override_id, member_id
    from unnest(p_member_ids) as member_id;
  end if;

  return v_override_id;
end;
$$;

create or replace function public.split_schedule_event_series(
  p_family_id uuid,
  p_series_event_id uuid,
  p_split_date date,
  p_new_event_id uuid,
  p_actor_member_id uuid,
  p_event jsonb,
  p_recurrence jsonb,
  p_member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.schedule_event_recurrences
  set ends_on = p_split_date - 1, occurrence_count = null
  where family_id = p_family_id and event_id = p_series_event_id;

  if not found then
    raise exception 'Recurring schedule event not found.';
  end if;

  insert into public.schedule_events (
    id, family_id, member_id, created_by_member_id, event_type, title,
    description, starts_at, ends_at, all_day, location, color
  ) values (
    p_new_event_id,
    p_family_id,
    p_member_ids[1],
    p_actor_member_id,
    (p_event->>'event_type')::public.schedule_event_type,
    p_event->>'title',
    p_event->>'description',
    (p_event->>'starts_at')::timestamptz,
    (p_event->>'ends_at')::timestamptz,
    (p_event->>'all_day')::boolean,
    p_event->>'location',
    p_event->>'color'
  );

  insert into public.schedule_event_members (family_id, schedule_event_id, member_id)
  select p_family_id, p_new_event_id, member_id
  from unnest(p_member_ids) as member_id;

  insert into public.schedule_event_recurrences (
    event_id, family_id, frequency, interval_count, weekdays,
    ends_on, occurrence_count, time_zone
  ) values (
    p_new_event_id,
    p_family_id,
    (p_recurrence->>'frequency')::public.schedule_recurrence_frequency,
    (p_recurrence->>'interval_count')::smallint,
    coalesce(
      (select array_agg(value::smallint) from jsonb_array_elements_text(p_recurrence->'weekdays')),
      '{}'::smallint[]
    ),
    nullif(p_recurrence->>'ends_on', '')::date,
    nullif(p_recurrence->>'occurrence_count', '')::integer,
    p_recurrence->>'time_zone'
  );

  delete from public.schedule_event_occurrence_overrides
  where family_id = p_family_id
    and series_event_id = p_series_event_id
    and occurrence_date = p_split_date;

  update public.schedule_event_occurrence_overrides
  set series_event_id = p_new_event_id
  where family_id = p_family_id
    and series_event_id = p_series_event_id
    and occurrence_date > p_split_date;

  return p_new_event_id;
end;
$$;

create or replace function public.truncate_schedule_event_series(
  p_family_id uuid,
  p_series_event_id uuid,
  p_split_date date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
    and not public.current_user_has_family_role(
      p_family_id,
      array['parent']::public.family_role[]
    )
  then
    raise exception 'Only a parent can delete schedule events.';
  end if;

  update public.schedule_event_recurrences
  set ends_on = p_split_date - 1, occurrence_count = null
  where family_id = p_family_id and event_id = p_series_event_id;

  if not found then
    raise exception 'Recurring schedule event not found.';
  end if;

  delete from public.schedule_event_occurrence_overrides
  where family_id = p_family_id
    and series_event_id = p_series_event_id
    and occurrence_date >= p_split_date;
end;
$$;

revoke all on function public.upsert_schedule_occurrence_override(uuid, uuid, date, uuid, public.schedule_occurrence_override_status, jsonb, uuid[]) from public;
revoke all on function public.split_schedule_event_series(uuid, uuid, date, uuid, uuid, jsonb, jsonb, uuid[]) from public;
revoke all on function public.truncate_schedule_event_series(uuid, uuid, date) from public;

grant execute on function public.upsert_schedule_occurrence_override(uuid, uuid, date, uuid, public.schedule_occurrence_override_status, jsonb, uuid[]) to authenticated, service_role;
grant execute on function public.split_schedule_event_series(uuid, uuid, date, uuid, uuid, jsonb, jsonb, uuid[]) to authenticated, service_role;
grant execute on function public.truncate_schedule_event_series(uuid, uuid, date) to authenticated, service_role;

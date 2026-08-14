alter table public.schedule_events
  add column import_uid text,
  add column import_source_name text,
  add column imported_at timestamptz;

alter table public.schedule_events
  add constraint schedule_events_import_uid_length_check
    check (import_uid is null or char_length(import_uid) between 1 and 500),
  add constraint schedule_events_import_source_name_length_check
    check (import_source_name is null or char_length(import_source_name) between 1 and 255),
  add constraint schedule_events_import_metadata_check
    check (
      (import_uid is null and import_source_name is null and imported_at is null)
      or
      (import_uid is not null and import_source_name is not null and imported_at is not null)
    );

create unique index schedule_events_family_import_uid_key
  on public.schedule_events(family_id, import_uid)
  where import_uid is not null;

create or replace function public.import_schedule_event(
  p_event_id uuid,
  p_family_id uuid,
  p_member_ids uuid[],
  p_created_by_member_id uuid,
  p_event_type public.schedule_event_type,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_all_day boolean,
  p_location text,
  p_color text,
  p_import_uid text,
  p_import_source_name text,
  p_recurrence_frequency public.schedule_recurrence_frequency,
  p_recurrence_interval smallint,
  p_recurrence_weekdays smallint[],
  p_recurrence_ends_on date,
  p_recurrence_occurrence_count integer,
  p_time_zone text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_member_ids uuid[] := coalesce(p_member_ids, '{}'::uuid[]);
begin
  if p_title is null or char_length(btrim(p_title)) not between 1 and 140 then
    raise exception 'Imported event titles must contain 1 to 140 characters.';
  end if;

  if p_description is not null and char_length(p_description) > 500 then
    raise exception 'Imported event notes must contain 500 characters or fewer.';
  end if;

  if p_location is not null and char_length(p_location) > 160 then
    raise exception 'Imported event locations must contain 160 characters or fewer.';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'Imported event end must be after its start.';
  end if;

  if p_import_uid is null or char_length(btrim(p_import_uid)) not between 1 and 500 then
    raise exception 'Imported event UID must contain 1 to 500 characters.';
  end if;

  if p_import_source_name is null
     or char_length(btrim(p_import_source_name)) not between 1 and 255 then
    raise exception 'Import source name must contain 1 to 255 characters.';
  end if;

  if cardinality(v_member_ids) <> cardinality(array(select distinct unnest(v_member_ids))) then
    raise exception 'Imported event member IDs must be unique.';
  end if;

  if p_recurrence_frequency is not null then
    if p_recurrence_interval is null or p_recurrence_interval not between 1 and 365 then
      raise exception 'Imported recurrence interval must be between 1 and 365.';
    end if;

    if p_time_zone is null or char_length(p_time_zone) not between 1 and 100 then
      raise exception 'Imported recurrence time zone is invalid.';
    end if;
  end if;

  insert into public.schedule_events (
    id,
    family_id,
    member_id,
    created_by_member_id,
    event_type,
    title,
    description,
    starts_at,
    ends_at,
    all_day,
    location,
    color,
    import_uid,
    import_source_name,
    imported_at
  ) values (
    p_event_id,
    p_family_id,
    v_member_ids[1],
    p_created_by_member_id,
    p_event_type,
    btrim(p_title),
    p_description,
    p_starts_at,
    p_ends_at,
    coalesce(p_all_day, false),
    p_location,
    p_color,
    btrim(p_import_uid),
    btrim(p_import_source_name),
    now()
  );

  insert into public.schedule_event_members (
    family_id,
    schedule_event_id,
    member_id
  )
  select p_family_id, p_event_id, member_id
  from unnest(v_member_ids) as member_id;

  if p_recurrence_frequency is not null then
    insert into public.schedule_event_recurrences (
      event_id,
      family_id,
      frequency,
      interval_count,
      weekdays,
      ends_on,
      occurrence_count,
      time_zone
    ) values (
      p_event_id,
      p_family_id,
      p_recurrence_frequency,
      p_recurrence_interval,
      coalesce(p_recurrence_weekdays, '{}'::smallint[]),
      p_recurrence_ends_on,
      p_recurrence_occurrence_count,
      p_time_zone
    );
  end if;

  return p_event_id;
end;
$$;

revoke all on function public.import_schedule_event(
  uuid,
  uuid,
  uuid[],
  uuid,
  public.schedule_event_type,
  text,
  text,
  timestamptz,
  timestamptz,
  boolean,
  text,
  text,
  text,
  text,
  public.schedule_recurrence_frequency,
  smallint,
  smallint[],
  date,
  integer,
  text
) from public, anon;

grant execute on function public.import_schedule_event(
  uuid,
  uuid,
  uuid[],
  uuid,
  public.schedule_event_type,
  text,
  text,
  timestamptz,
  timestamptz,
  boolean,
  text,
  text,
  text,
  text,
  public.schedule_recurrence_frequency,
  smallint,
  smallint[],
  date,
  integer,
  text
) to authenticated, service_role;

comment on function public.import_schedule_event(
  uuid,
  uuid,
  uuid[],
  uuid,
  public.schedule_event_type,
  text,
  text,
  timestamptz,
  timestamptz,
  boolean,
  text,
  text,
  text,
  text,
  public.schedule_recurrence_frequency,
  smallint,
  smallint[],
  date,
  integer,
  text
) is 'Atomically imports one validated ICS event and its attendee/recurrence rows under existing RLS.';

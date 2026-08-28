-- Phase 23 No School schedule type verification.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'schedule_event_type'
      and e.enumlabel = 'no_school'
  ) then
    raise exception 'schedule_event_type is missing no_school';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schedule_events'::regclass
      and conname = 'schedule_events_no_school_all_day_check'
  ) then
    raise exception 'schedule_events does not enforce No School as all day';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schedule_event_occurrence_overrides'::regclass
      and conname = 'schedule_overrides_no_school_all_day_check'
  ) then
    raise exception 'schedule overrides do not enforce No School as all day';
  end if;
end $$;

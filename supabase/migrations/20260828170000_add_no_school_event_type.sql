alter type public.schedule_event_type add value if not exists 'no_school';

alter table public.schedule_events
  add constraint schedule_events_no_school_all_day_check
  check (event_type::text <> 'no_school' or all_day);

alter table public.schedule_event_occurrence_overrides
  add constraint schedule_overrides_no_school_all_day_check
  check (event_type::text <> 'no_school' or all_day);

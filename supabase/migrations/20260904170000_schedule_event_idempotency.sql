alter table public.schedule_events
  add column if not exists idempotency_key uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedule_events_creator_idempotency_key_key'
      and conrelid = 'public.schedule_events'::regclass
  ) then
    alter table public.schedule_events
      add constraint schedule_events_creator_idempotency_key_key
      unique (family_id, created_by_member_id, idempotency_key);
  end if;
end $$;

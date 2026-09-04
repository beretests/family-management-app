-- Supabase projects do not universally grant Data API roles access to tables
-- created after project initialization. Keep object privileges explicit so
-- PostgreSQL can reach the existing RLS policies.

revoke all on table public.family_member_pin_credentials
  from anon, authenticated;
revoke all on table public.family_invitations
  from anon, authenticated;
revoke all on table public.schedule_event_members
  from anon, authenticated;
revoke all on table public.schedule_event_recurrences
  from anon, authenticated;
revoke all on table public.schedule_event_occurrence_overrides
  from anon, authenticated;
revoke all on table public.schedule_event_occurrence_override_members
  from anon, authenticated;

grant select, insert, update
  on table public.family_member_pin_credentials
  to authenticated;

grant select, insert, update
  on table public.family_invitations
  to authenticated;

grant select, insert, delete
  on table public.schedule_event_members
  to authenticated;

grant select, insert, update, delete
  on table public.schedule_event_recurrences
  to authenticated;

grant select, insert, update, delete
  on table public.schedule_event_occurrence_overrides
  to authenticated;

grant select, insert, delete
  on table public.schedule_event_occurrence_override_members
  to authenticated;

-- Secret-key clients still need object privileges even though service_role
-- bypasses RLS. Grant only operations used by reviewed server-only workflows.
grant select, insert, update
  on table public.profiles
  to service_role;

grant update
  on table public.family_members
  to service_role;

grant select, insert, update
  on table public.family_member_auth_links
  to service_role;

grant select, update
  on table public.family_invitations
  to service_role;

grant select, update
  on table public.family_child_invitations
  to service_role;

grant select, insert, update, delete
  on table public.schedule_events
  to service_role;

grant insert, delete
  on table public.schedule_event_members
  to service_role;

grant insert, update, delete
  on table public.schedule_event_recurrences
  to service_role;

grant select, insert, update, delete
  on table public.schedule_event_occurrence_overrides
  to service_role;

grant insert, delete
  on table public.schedule_event_occurrence_override_members
  to service_role;

grant select, insert
  on table public.grocery_catalog_items
  to service_role;

grant select, insert, delete
  on table public.grocery_lists
  to service_role;

grant select, insert, update, delete
  on table public.grocery_list_items
  to service_role;

grant select
  on table public.task_instances, public.reward_catalog, public.reward_redemptions
  to service_role;

grant select, update
  on table public.task_instance_subtasks
  to service_role;

grant select, insert, delete
  on table public.task_evidence_files
  to service_role;

grant select, insert
  on table public.task_submissions
  to service_role;

grant select, insert, update
  on table public.reminders
  to service_role;

grant insert
  on table public.audit_events
  to service_role;

grant execute on function public.submit_task_instance(uuid, uuid)
  to service_role;

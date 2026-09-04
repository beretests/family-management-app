-- Run after applying all migrations. Every query should return zero rows.

-- Authenticated requests need these object privileges before PostgreSQL can
-- evaluate the existing family- and parent-scoped RLS policies.
with expected(table_name, privilege_type) as (
  values
    ('family_member_pin_credentials', 'SELECT'),
    ('family_member_pin_credentials', 'INSERT'),
    ('family_member_pin_credentials', 'UPDATE'),
    ('family_invitations', 'SELECT'),
    ('family_invitations', 'INSERT'),
    ('family_invitations', 'UPDATE'),
    ('schedule_event_members', 'SELECT'),
    ('schedule_event_members', 'INSERT'),
    ('schedule_event_members', 'DELETE'),
    ('schedule_event_recurrences', 'SELECT'),
    ('schedule_event_recurrences', 'INSERT'),
    ('schedule_event_recurrences', 'UPDATE'),
    ('schedule_event_recurrences', 'DELETE'),
    ('schedule_event_occurrence_overrides', 'SELECT'),
    ('schedule_event_occurrence_overrides', 'INSERT'),
    ('schedule_event_occurrence_overrides', 'UPDATE'),
    ('schedule_event_occurrence_overrides', 'DELETE'),
    ('schedule_event_occurrence_override_members', 'SELECT'),
    ('schedule_event_occurrence_override_members', 'INSERT'),
    ('schedule_event_occurrence_override_members', 'DELETE')
)
select table_name, privilege_type
from expected
where not has_table_privilege(
  'authenticated',
  format('public.%I', table_name),
  privilege_type
);

-- Do not accidentally expose these private family tables to signed-out users.
with protected_tables(table_name) as (
  values
    ('family_member_pin_credentials'),
    ('family_invitations'),
    ('schedule_event_members'),
    ('schedule_event_recurrences'),
    ('schedule_event_occurrence_overrides'),
    ('schedule_event_occurrence_override_members')
), data_api_privileges(privilege_type) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
select table_name, privilege_type
from protected_tables
cross join data_api_privileges
where has_table_privilege(
  'anon',
  format('public.%I', table_name),
  privilege_type
);

-- Keep authenticated object grants limited to operations used by the app.
with protected_tables(table_name) as (
  values
    ('family_member_pin_credentials'),
    ('family_invitations'),
    ('schedule_event_members'),
    ('schedule_event_recurrences'),
    ('schedule_event_occurrence_overrides'),
    ('schedule_event_occurrence_override_members')
), data_api_privileges(privilege_type) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
), expected(table_name, privilege_type) as (
  values
    ('family_member_pin_credentials', 'SELECT'),
    ('family_member_pin_credentials', 'INSERT'),
    ('family_member_pin_credentials', 'UPDATE'),
    ('family_invitations', 'SELECT'),
    ('family_invitations', 'INSERT'),
    ('family_invitations', 'UPDATE'),
    ('schedule_event_members', 'SELECT'),
    ('schedule_event_members', 'INSERT'),
    ('schedule_event_members', 'DELETE'),
    ('schedule_event_recurrences', 'SELECT'),
    ('schedule_event_recurrences', 'INSERT'),
    ('schedule_event_recurrences', 'UPDATE'),
    ('schedule_event_recurrences', 'DELETE'),
    ('schedule_event_occurrence_overrides', 'SELECT'),
    ('schedule_event_occurrence_overrides', 'INSERT'),
    ('schedule_event_occurrence_overrides', 'UPDATE'),
    ('schedule_event_occurrence_overrides', 'DELETE'),
    ('schedule_event_occurrence_override_members', 'SELECT'),
    ('schedule_event_occurrence_override_members', 'INSERT'),
    ('schedule_event_occurrence_override_members', 'DELETE')
)
select protected_tables.table_name, data_api_privileges.privilege_type
from protected_tables
cross join data_api_privileges
where has_table_privilege(
  'authenticated',
  format('public.%I', protected_tables.table_name),
  data_api_privileges.privilege_type
)
and not exists (
  select 1
  from expected
  where expected.table_name = protected_tables.table_name
    and expected.privilege_type = data_api_privileges.privilege_type
);

-- Server-only secret-key workflows use service_role. RLS bypass does not
-- replace these object privileges, so verify their required minimum grants.
with expected(table_name, privilege_type) as (
  values
    ('profiles', 'SELECT'),
    ('profiles', 'INSERT'),
    ('profiles', 'UPDATE'),
    ('family_members', 'UPDATE'),
    ('family_member_auth_links', 'SELECT'),
    ('family_member_auth_links', 'INSERT'),
    ('family_member_auth_links', 'UPDATE'),
    ('family_invitations', 'SELECT'),
    ('family_invitations', 'UPDATE'),
    ('family_child_invitations', 'SELECT'),
    ('family_child_invitations', 'UPDATE'),
    ('schedule_events', 'SELECT'),
    ('schedule_events', 'INSERT'),
    ('schedule_events', 'UPDATE'),
    ('schedule_events', 'DELETE'),
    ('schedule_event_members', 'INSERT'),
    ('schedule_event_members', 'DELETE'),
    ('schedule_event_recurrences', 'INSERT'),
    ('schedule_event_recurrences', 'UPDATE'),
    ('schedule_event_recurrences', 'DELETE'),
    ('schedule_event_occurrence_overrides', 'SELECT'),
    ('schedule_event_occurrence_overrides', 'INSERT'),
    ('schedule_event_occurrence_overrides', 'UPDATE'),
    ('schedule_event_occurrence_overrides', 'DELETE'),
    ('schedule_event_occurrence_override_members', 'INSERT'),
    ('schedule_event_occurrence_override_members', 'DELETE'),
    ('grocery_catalog_items', 'SELECT'),
    ('grocery_catalog_items', 'INSERT'),
    ('grocery_lists', 'SELECT'),
    ('grocery_lists', 'INSERT'),
    ('grocery_lists', 'DELETE'),
    ('grocery_list_items', 'SELECT'),
    ('grocery_list_items', 'INSERT'),
    ('grocery_list_items', 'UPDATE'),
    ('grocery_list_items', 'DELETE'),
    ('task_instances', 'SELECT'),
    ('task_instance_subtasks', 'SELECT'),
    ('task_instance_subtasks', 'UPDATE'),
    ('task_evidence_files', 'SELECT'),
    ('task_evidence_files', 'INSERT'),
    ('task_evidence_files', 'DELETE'),
    ('task_submissions', 'SELECT'),
    ('task_submissions', 'INSERT'),
    ('reward_catalog', 'SELECT'),
    ('reward_redemptions', 'SELECT'),
    ('reminders', 'SELECT'),
    ('reminders', 'INSERT'),
    ('reminders', 'UPDATE'),
    ('audit_events', 'INSERT')
)
select table_name, privilege_type
from expected
where not has_table_privilege(
  'service_role',
  format('public.%I', table_name),
  privilege_type
);

-- Kid Mode task submission calls this reviewed security-definer function
-- through the server-only client.
select 'public.submit_task_instance(uuid, uuid)' as function_name
where not has_function_privilege(
  'service_role',
  'public.submit_task_instance(uuid, uuid)',
  'EXECUTE'
);

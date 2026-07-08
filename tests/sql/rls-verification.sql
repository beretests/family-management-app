-- Run after applying migrations in a local Supabase database.
-- Each query should return zero rows unless noted otherwise.

-- Family-owned tables should have RLS enabled.
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'families',
    'family_members',
    'family_member_auth_links',
    'family_member_preferences',
    'family_member_statuses',
    'house_profiles',
    'rooms',
    'chore_templates',
    'chore_template_subtasks',
    'task_instances',
    'task_instance_subtasks',
    'task_submissions',
    'task_evidence_files',
    'task_reviews',
    'schedule_events',
    'swap_requests',
    'reward_catalog',
    'reward_redemptions',
    'points_ledger',
    'leaderboard_snapshots',
    'reminders',
    'audit_events',
    'app_settings'
  )
  and not c.relrowsecurity;

-- Family-owned tables should include family_id.
select table_name as family_owned_table_missing_family_id
from (
  values
    ('family_members'),
    ('family_member_auth_links'),
    ('family_member_preferences'),
    ('family_member_statuses'),
    ('house_profiles'),
    ('rooms'),
    ('chore_templates'),
    ('chore_template_subtasks'),
    ('task_instances'),
    ('task_instance_subtasks'),
    ('task_submissions'),
    ('task_evidence_files'),
    ('task_reviews'),
    ('schedule_events'),
    ('swap_requests'),
    ('reward_catalog'),
    ('reward_redemptions'),
    ('points_ledger'),
    ('leaderboard_snapshots'),
    ('reminders'),
    ('audit_events'),
    ('app_settings')
) as expected(table_name)
where not exists (
  select 1
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = expected.table_name
    and c.column_name = 'family_id'
);

-- Starter chore seed should include the approved starter library.
-- This should return one row with starter_template_count = 14.
select count(*) as starter_template_count
from public.starter_chore_templates;

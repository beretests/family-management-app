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
    'family_member_pin_credentials',
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
    ('family_member_pin_credentials'),
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

-- Authenticated parent bootstrap should work under RLS. This verifies the
-- first parent family_members row can be inserted before any family members
-- exist, then rolls back all temporary rows.
begin;
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'phase4-bootstrap@example.com',
  'test-only',
  now(),
  now(),
  now()
);
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
insert into public.profiles(id, display_name)
values ('11111111-1111-4111-8111-111111111111', 'Phase 4 Parent');
insert into public.families(id, name, created_by_profile_id)
values (
  '22222222-2222-4222-8222-222222222222',
  'Phase 4 Family',
  '11111111-1111-4111-8111-111111111111'
);
insert into public.family_members(
  id,
  family_id,
  profile_id,
  display_name,
  role
) values (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Phase 4 Parent',
  'parent'
);
rollback;

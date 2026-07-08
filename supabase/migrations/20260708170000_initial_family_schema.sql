create extension if not exists pgcrypto;

create type public.family_role as enum ('parent', 'caregiver', 'child');
create type public.family_member_lifecycle_status as enum ('active', 'inactive');
create type public.family_member_status_state as enum ('normal', 'under_the_weather', 'sick', 'rest_day');
create type public.chore_frequency as enum ('daily', 'weekly', 'monthly', 'seasonal', 'ad_hoc');
create type public.task_status as enum ('draft', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'overdue', 'cancelled');
create type public.task_submission_status as enum ('submitted', 'superseded', 'withdrawn');
create type public.review_decision as enum ('approved', 'rejected');
create type public.schedule_event_type as enum ('school', 'extracurricular', 'appointment', 'family_event', 'rest_sick', 'parent_work', 'chore_task');
create type public.swap_request_status as enum ('requested', 'accepted_by_sibling', 'declined_by_sibling', 'approved', 'rejected', 'cancelled');
create type public.reward_redemption_status as enum ('requested', 'approved', 'rejected', 'fulfilled', 'cancelled');
create type public.reminder_status as enum ('pending', 'sent', 'dismissed', 'cancelled');
create type public.points_ledger_source as enum ('task_review', 'manual_adjustment', 'reward_redemption', 'swap_adjustment');
create type public.evidence_type as enum ('photo', 'note');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role public.family_role not null,
  birthdate date,
  age_years integer check (age_years is null or age_years between 0 and 120),
  ability_level integer not null default 3 check (ability_level between 1 and 5),
  color text,
  lifecycle_status public.family_member_lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  unique (id, family_id)
);

create unique index family_members_one_profile_per_family_idx
  on public.family_members(family_id, profile_id)
  where profile_id is not null;

create table public.family_member_auth_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  member_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (family_id, member_id, profile_id),
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create table public.family_member_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  member_id uuid not null,
  disliked_chore_template_ids uuid[] not null default '{}',
  preferred_chore_template_ids uuid[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id),
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create table public.family_member_statuses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  member_id uuid not null,
  status public.family_member_status_state not null default 'normal',
  note text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  requested_by_member_id uuid references public.family_members(id) on delete set null,
  approved_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (member_id, family_id)
    references public.family_members(id, family_id)
    on delete cascade
);

create table public.house_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  kitchens integer not null default 1 check (kitchens >= 0),
  dining_areas integer not null default 1 check (dining_areas >= 0),
  living_rooms integer not null default 1 check (living_rooms >= 0),
  half_bathrooms integer not null default 0 check (half_bathrooms >= 0),
  full_bathrooms integer not null default 1 check (full_bathrooms >= 0),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  has_laundry_room boolean not null default false,
  has_stairs boolean not null default false,
  has_entryway boolean not null default false,
  has_yard boolean not null default false,
  has_garden boolean not null default false,
  has_garage boolean not null default false,
  car_chores_enabled boolean not null default false,
  grocery_chores_enabled boolean not null default false,
  pets_present boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  house_profile_id uuid references public.house_profiles(id) on delete cascade,
  name text not null,
  room_type text not null,
  level text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chore_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  emoji text,
  description text,
  category text not null,
  location text,
  frequency public.chore_frequency not null,
  estimated_minutes integer not null check (estimated_minutes > 0),
  difficulty integer not null check (difficulty between 1 and 5),
  base_points integer not null check (base_points >= 0),
  minimum_age integer not null default 0 check (minimum_age >= 0),
  maximum_age integer check (maximum_age is null or maximum_age >= minimum_age),
  requires_parent_review boolean not null default true,
  requires_evidence boolean not null default false,
  evidence_type public.evidence_type,
  undesirable_score integer not null default 0 check (undesirable_score between 0 and 5),
  dependency_template_ids uuid[] not null default '{}',
  completion_check_text text,
  safety_notes text,
  active boolean not null default true,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chore_template_subtasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  template_id uuid not null references public.chore_templates(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, position)
);

create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  template_id uuid references public.chore_templates(id) on delete set null,
  assigned_to_member_id uuid references public.family_members(id) on delete set null,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  title_snapshot text not null,
  subtasks_snapshot jsonb not null default '[]'::jsonb,
  points_possible integer not null default 0 check (points_possible >= 0),
  points_awarded integer check (points_awarded is null or points_awarded >= 0),
  status public.task_status not null default 'draft',
  due_at timestamptz,
  available_from timestamptz,
  completed_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_count integer not null default 0 check (rejection_count >= 0),
  rejection_reason text,
  assignment_reason text,
  difficulty_snapshot integer not null check (difficulty_snapshot between 1 and 5),
  estimated_minutes_snapshot integer not null check (estimated_minutes_snapshot > 0),
  is_undesirable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_instance_subtasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_instance_id, position)
);

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  submitted_by_member_id uuid not null references public.family_members(id) on delete cascade,
  status public.task_submission_status not null default 'submitted',
  note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_evidence_files (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  submission_id uuid references public.task_submissions(id) on delete cascade,
  uploaded_by_member_id uuid not null references public.family_members(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  content_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  retention_delete_after timestamptz,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.task_reviews (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  submission_id uuid references public.task_submissions(id) on delete set null,
  reviewed_by_member_id uuid not null references public.family_members(id) on delete restrict,
  decision public.review_decision not null,
  feedback text,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  resubmission_due_at timestamptz,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete cascade,
  task_instance_id uuid references public.task_instances(id) on delete cascade,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  event_type public.schedule_event_type not null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  location text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  requested_by_member_id uuid not null references public.family_members(id) on delete cascade,
  target_member_id uuid references public.family_members(id) on delete set null,
  status public.swap_request_status not null default 'requested',
  reason text,
  fairness_snapshot jsonb not null default '{}'::jsonb,
  parent_reviewed_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_catalog (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text,
  points_cost integer not null check (points_cost >= 0),
  minimum_age integer check (minimum_age is null or minimum_age >= 0),
  maximum_age integer check (maximum_age is null or maximum_age >= coalesce(minimum_age, 0)),
  active boolean not null default true,
  requires_parent_approval boolean not null default true,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  reward_id uuid not null references public.reward_catalog(id) on delete restrict,
  requested_by_member_id uuid not null references public.family_members(id) on delete cascade,
  reviewed_by_member_id uuid references public.family_members(id) on delete set null,
  status public.reward_redemption_status not null default 'requested',
  points_spent integer not null check (points_spent >= 0),
  note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  task_instance_id uuid references public.task_instances(id) on delete set null,
  reward_redemption_id uuid references public.reward_redemptions(id) on delete set null,
  source public.points_ledger_source not null,
  points_delta integer not null,
  note text,
  created_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  mode text not null,
  snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (family_id, period_start, period_end, mode),
  check (period_end >= period_start)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete cascade,
  task_instance_id uuid references public.task_instances(id) on delete cascade,
  reward_redemption_id uuid references public.reward_redemptions(id) on delete cascade,
  reminder_type text not null,
  message text not null,
  remind_at timestamptz not null,
  status public.reminder_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  actor_member_id uuid references public.family_members(id) on delete set null,
  event_type text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, key)
);

create table public.starter_chore_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  emoji text,
  description text,
  category text not null,
  location text,
  frequency public.chore_frequency not null,
  estimated_minutes integer not null check (estimated_minutes > 0),
  difficulty integer not null check (difficulty between 1 and 5),
  base_points integer not null check (base_points >= 0),
  minimum_age integer not null default 0 check (minimum_age >= 0),
  maximum_age integer check (maximum_age is null or maximum_age >= minimum_age),
  requires_parent_review boolean not null default true,
  requires_evidence boolean not null default false,
  evidence_type public.evidence_type,
  undesirable_score integer not null default 0 check (undesirable_score between 0 and 5),
  dependency_slugs text[] not null default '{}',
  completion_check_text text,
  safety_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.starter_chore_template_subtasks (
  id uuid primary key default gen_random_uuid(),
  starter_template_id uuid not null references public.starter_chore_templates(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  created_at timestamptz not null default now(),
  unique (starter_template_id, position)
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger families_set_updated_at before update on public.families
  for each row execute function public.set_updated_at();
create trigger family_members_set_updated_at before update on public.family_members
  for each row execute function public.set_updated_at();
create trigger family_member_preferences_set_updated_at before update on public.family_member_preferences
  for each row execute function public.set_updated_at();
create trigger family_member_statuses_set_updated_at before update on public.family_member_statuses
  for each row execute function public.set_updated_at();
create trigger house_profiles_set_updated_at before update on public.house_profiles
  for each row execute function public.set_updated_at();
create trigger rooms_set_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();
create trigger chore_templates_set_updated_at before update on public.chore_templates
  for each row execute function public.set_updated_at();
create trigger chore_template_subtasks_set_updated_at before update on public.chore_template_subtasks
  for each row execute function public.set_updated_at();
create trigger task_instances_set_updated_at before update on public.task_instances
  for each row execute function public.set_updated_at();
create trigger task_instance_subtasks_set_updated_at before update on public.task_instance_subtasks
  for each row execute function public.set_updated_at();
create trigger task_submissions_set_updated_at before update on public.task_submissions
  for each row execute function public.set_updated_at();
create trigger schedule_events_set_updated_at before update on public.schedule_events
  for each row execute function public.set_updated_at();
create trigger swap_requests_set_updated_at before update on public.swap_requests
  for each row execute function public.set_updated_at();
create trigger reward_catalog_set_updated_at before update on public.reward_catalog
  for each row execute function public.set_updated_at();
create trigger reward_redemptions_set_updated_at before update on public.reward_redemptions
  for each row execute function public.set_updated_at();
create trigger reminders_set_updated_at before update on public.reminders
  for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();
create trigger starter_chore_templates_set_updated_at before update on public.starter_chore_templates
  for each row execute function public.set_updated_at();

create function public.current_user_member_ids(p_family_id uuid)
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(fm.id), '{}'::uuid[])
  from public.family_members fm
  left join public.family_member_auth_links fmal
    on fmal.member_id = fm.id
    and fmal.family_id = fm.family_id
    and fmal.revoked_at is null
  where fm.family_id = p_family_id
    and fm.lifecycle_status = 'active'
    and (
      fm.profile_id = auth.uid()
      or fmal.profile_id = auth.uid()
    );
$$;

create function public.current_user_is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_length(public.current_user_member_ids(p_family_id), 1), 0) > 0;
$$;

create function public.current_user_has_family_role(
  p_family_id uuid,
  p_roles public.family_role[]
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    left join public.family_member_auth_links fmal
      on fmal.member_id = fm.id
      and fmal.family_id = fm.family_id
      and fmal.revoked_at is null
    where fm.family_id = p_family_id
      and fm.lifecycle_status = 'active'
      and fm.role = any(p_roles)
      and (
        fm.profile_id = auth.uid()
        or fmal.profile_id = auth.uid()
      )
  );
$$;

create function public.family_has_no_members(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
  );
$$;

create function public.current_user_can_read_task(p_task_instance_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.task_instances ti
    where ti.id = p_task_instance_id
      and (
        public.current_user_has_family_role(ti.family_id, array['parent', 'caregiver']::public.family_role[])
        or ti.assigned_to_member_id = any(public.current_user_member_ids(ti.family_id))
      )
  );
$$;

create function public.current_user_can_submit_task(p_task_instance_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.task_instances ti
    where ti.id = p_task_instance_id
      and ti.assigned_to_member_id = any(public.current_user_member_ids(ti.family_id))
      and ti.status in ('assigned', 'in_progress', 'rejected')
  );
$$;

create index families_created_by_profile_id_idx on public.families(created_by_profile_id);
create index family_members_family_id_idx on public.family_members(family_id);
create index family_members_profile_id_idx on public.family_members(profile_id);
create index family_member_auth_links_profile_id_idx on public.family_member_auth_links(profile_id);
create index family_member_preferences_family_id_idx on public.family_member_preferences(family_id);
create index family_member_statuses_family_id_member_id_idx on public.family_member_statuses(family_id, member_id);
create index house_profiles_family_id_idx on public.house_profiles(family_id);
create index rooms_family_id_idx on public.rooms(family_id);
create index chore_templates_family_id_idx on public.chore_templates(family_id);
create index chore_templates_family_active_idx on public.chore_templates(family_id, active);
create index chore_template_subtasks_family_template_idx on public.chore_template_subtasks(family_id, template_id);
create index task_instances_family_id_idx on public.task_instances(family_id);
create index task_instances_assigned_to_member_id_idx on public.task_instances(assigned_to_member_id);
create index task_instances_due_at_idx on public.task_instances(due_at);
create index task_instances_status_idx on public.task_instances(status);
create index task_instance_subtasks_task_idx on public.task_instance_subtasks(task_instance_id);
create index task_submissions_task_idx on public.task_submissions(task_instance_id);
create index task_evidence_files_task_idx on public.task_evidence_files(task_instance_id);
create index task_reviews_task_idx on public.task_reviews(task_instance_id);
create index schedule_events_family_range_idx on public.schedule_events(family_id, starts_at, ends_at);
create index schedule_events_member_range_idx on public.schedule_events(member_id, starts_at, ends_at);
create index swap_requests_family_status_idx on public.swap_requests(family_id, status);
create index reward_catalog_family_active_idx on public.reward_catalog(family_id, active);
create index reward_redemptions_family_status_idx on public.reward_redemptions(family_id, status);
create index points_ledger_family_member_idx on public.points_ledger(family_id, member_id, created_at);
create index leaderboard_snapshots_family_period_idx on public.leaderboard_snapshots(family_id, period_start, period_end);
create index reminders_family_status_time_idx on public.reminders(family_id, status, remind_at);
create index audit_events_family_created_idx on public.audit_events(family_id, created_at);

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_member_auth_links enable row level security;
alter table public.family_member_preferences enable row level security;
alter table public.family_member_statuses enable row level security;
alter table public.house_profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.chore_templates enable row level security;
alter table public.chore_template_subtasks enable row level security;
alter table public.task_instances enable row level security;
alter table public.task_instance_subtasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.task_evidence_files enable row level security;
alter table public.task_reviews enable row level security;
alter table public.schedule_events enable row level security;
alter table public.swap_requests enable row level security;
alter table public.reward_catalog enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.points_ledger enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.starter_chore_templates enable row level security;
alter table public.starter_chore_template_subtasks enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy families_select_members on public.families
  for select to authenticated using (public.current_user_is_family_member(id));
create policy families_insert_creator on public.families
  for insert to authenticated with check (created_by_profile_id = auth.uid());
create policy families_update_parents on public.families
  for update to authenticated
  using (public.current_user_has_family_role(id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(id, array['parent']::public.family_role[]));

create policy family_members_select_members on public.family_members
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy family_members_insert_initial_parent on public.family_members
  for insert to authenticated
  with check (
    role = 'parent'
    and profile_id = auth.uid()
    and exists (
      select 1 from public.families f
      where f.id = family_id
        and f.created_by_profile_id = auth.uid()
    )
    and public.family_has_no_members(family_id)
  );
create policy family_members_insert_parent on public.family_members
  for insert to authenticated
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));
create policy family_members_update_parent on public.family_members
  for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy family_member_auth_links_select_family on public.family_member_auth_links
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy family_member_auth_links_manage_parent on public.family_member_auth_links
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy family_member_preferences_select_family on public.family_member_preferences
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy family_member_preferences_manage_parent on public.family_member_preferences
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy family_member_statuses_select_family on public.family_member_statuses
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy family_member_statuses_insert_family on public.family_member_statuses
  for insert to authenticated
  with check (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    or requested_by_member_id = any(public.current_user_member_ids(family_id))
  );
create policy family_member_statuses_update_parent on public.family_member_statuses
  for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy house_profiles_select_family on public.house_profiles
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy house_profiles_manage_parent on public.house_profiles
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy rooms_select_family on public.rooms
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy rooms_manage_parent on public.rooms
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy chore_templates_select_family on public.chore_templates
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy chore_templates_manage_parent on public.chore_templates
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy chore_template_subtasks_select_family on public.chore_template_subtasks
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy chore_template_subtasks_manage_parent on public.chore_template_subtasks
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy task_instances_select_allowed on public.task_instances
  for select to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent', 'caregiver']::public.family_role[])
    or assigned_to_member_id = any(public.current_user_member_ids(family_id))
  );
create policy task_instances_manage_parent on public.task_instances
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy task_instance_subtasks_select_allowed on public.task_instance_subtasks
  for select to authenticated using (public.current_user_can_read_task(task_instance_id));
create policy task_instance_subtasks_manage_parent on public.task_instance_subtasks
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));
create policy task_instance_subtasks_update_assignee on public.task_instance_subtasks
  for update to authenticated
  using (public.current_user_can_submit_task(task_instance_id))
  with check (public.current_user_can_submit_task(task_instance_id));

create policy task_submissions_select_allowed on public.task_submissions
  for select to authenticated using (public.current_user_can_read_task(task_instance_id));
create policy task_submissions_insert_assignee on public.task_submissions
  for insert to authenticated
  with check (
    public.current_user_can_submit_task(task_instance_id)
    and submitted_by_member_id = any(public.current_user_member_ids(family_id))
  );
create policy task_submissions_update_parent on public.task_submissions
  for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy task_evidence_files_select_allowed on public.task_evidence_files
  for select to authenticated using (public.current_user_can_read_task(task_instance_id));
create policy task_evidence_files_insert_assignee on public.task_evidence_files
  for insert to authenticated
  with check (
    public.current_user_can_submit_task(task_instance_id)
    and uploaded_by_member_id = any(public.current_user_member_ids(family_id))
  );
create policy task_evidence_files_manage_parent on public.task_evidence_files
  for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy task_reviews_select_allowed on public.task_reviews
  for select to authenticated using (public.current_user_can_read_task(task_instance_id));
create policy task_reviews_manage_parent on public.task_reviews
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy schedule_events_select_family on public.schedule_events
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy schedule_events_manage_parent on public.schedule_events
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));
create policy schedule_events_insert_own_extracurricular on public.schedule_events
  for insert to authenticated
  with check (
    event_type = 'extracurricular'
    and member_id = any(public.current_user_member_ids(family_id))
  );
create policy schedule_events_update_own_extracurricular on public.schedule_events
  for update to authenticated
  using (
    event_type = 'extracurricular'
    and member_id = any(public.current_user_member_ids(family_id))
  )
  with check (
    event_type = 'extracurricular'
    and member_id = any(public.current_user_member_ids(family_id))
  );

create policy swap_requests_select_allowed on public.swap_requests
  for select to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    or requested_by_member_id = any(public.current_user_member_ids(family_id))
    or target_member_id = any(public.current_user_member_ids(family_id))
  );
create policy swap_requests_insert_requester on public.swap_requests
  for insert to authenticated
  with check (requested_by_member_id = any(public.current_user_member_ids(family_id)));
create policy swap_requests_update_parent_or_target on public.swap_requests
  for update to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    or target_member_id = any(public.current_user_member_ids(family_id))
  )
  with check (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    or target_member_id = any(public.current_user_member_ids(family_id))
  );

create policy reward_catalog_select_family on public.reward_catalog
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy reward_catalog_manage_parent on public.reward_catalog
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy reward_redemptions_select_allowed on public.reward_redemptions
  for select to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent']::public.family_role[])
    or requested_by_member_id = any(public.current_user_member_ids(family_id))
  );
create policy reward_redemptions_insert_requester on public.reward_redemptions
  for insert to authenticated
  with check (requested_by_member_id = any(public.current_user_member_ids(family_id)));
create policy reward_redemptions_update_parent on public.reward_redemptions
  for update to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy points_ledger_select_allowed on public.points_ledger
  for select to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent', 'caregiver']::public.family_role[])
    or member_id = any(public.current_user_member_ids(family_id))
  );
create policy points_ledger_insert_parent on public.points_ledger
  for insert to authenticated
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy leaderboard_snapshots_select_family on public.leaderboard_snapshots
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy leaderboard_snapshots_manage_parent on public.leaderboard_snapshots
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy reminders_select_allowed on public.reminders
  for select to authenticated
  using (
    public.current_user_has_family_role(family_id, array['parent', 'caregiver']::public.family_role[])
    or member_id = any(public.current_user_member_ids(family_id))
  );
create policy reminders_manage_parent on public.reminders
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy audit_events_select_parent on public.audit_events
  for select to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));
create policy audit_events_insert_parent on public.audit_events
  for insert to authenticated
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy app_settings_select_family on public.app_settings
  for select to authenticated using (public.current_user_is_family_member(family_id));
create policy app_settings_manage_parent on public.app_settings
  for all to authenticated
  using (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]))
  with check (public.current_user_has_family_role(family_id, array['parent']::public.family_role[]));

create policy starter_chore_templates_select_authenticated on public.starter_chore_templates
  for select to authenticated using (active = true);
create policy starter_chore_template_subtasks_select_authenticated on public.starter_chore_template_subtasks
  for select to authenticated using (
    exists (
      select 1
      from public.starter_chore_templates sct
      where sct.id = starter_template_id
        and sct.active = true
    )
  );

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

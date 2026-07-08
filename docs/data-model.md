# Data Model

Phase 3 adds the first Supabase Postgres schema for family-scoped app data.
Phase 4 wires the identity and family-member tables into the app UI.

## Identity And Families

- `profiles`: one row per Supabase Auth user. `id` matches `auth.users.id`.
- `families`: top-level family workspace.
- `family_members`: parent, caregiver, and child profiles inside a family.
  Children may have no Supabase Auth account in the MVP.
- `family_member_auth_links`: optional link from an auth profile to a family
  member, used later for older kids or caregiver linking.
- `family_member_preferences`: disliked/preferred chores and notes.
- `family_member_statuses`: normal, under-the-weather, sick, and rest-day
  status history.

Bootstrap flow:

1. Authenticated user inserts their `profiles` row.
2. User creates a `families` row with `created_by_profile_id = auth.uid()`.
3. User creates the first `family_members` parent row for that family.
4. Parent policies then allow managing the family.

Phase 4 adds a narrow RLS helper for step 3:
`current_user_created_family_without_members(family_id)`. It allows only the
creator of a family with no existing members to create their own initial parent
membership row.

Child profile management:

- Child profiles are `family_members` rows with `role = 'child'`.
- MVP child profiles do not require Supabase Auth accounts.
- Parent-entered preferences and dislikes are stored in
  `family_member_preferences.notes` until chore templates exist.
- Removing a child from active use sets `lifecycle_status = 'inactive'` and
  `deactivated_at`; it does not hard-delete history.
- Sick, rest, and under-the-weather updates append
  `family_member_statuses` rows.

## House And Chores

- `house_profiles`: room and home-feature counts used for generation.
- `rooms`: optional room inventory.
- `starter_chore_templates`: global reference chore library seeded from the
  product spec.
- `starter_chore_template_subtasks`: global reference subtasks.
- `chore_templates`: family-owned editable chore templates.
- `chore_template_subtasks`: family-owned template checklist items.

Starter templates are not family-owned. Later phases should copy starter rows
into `chore_templates` when parents configure their house.

## Tasks And Reviews

- `task_instances`: generated or manual chore assignments with denormalized
  snapshots for historical accuracy.
- `task_instance_subtasks`: checklist items for task instances.
- `task_submissions`: kid completion submissions.
- `task_evidence_files`: private storage metadata for future evidence uploads.
- `task_reviews`: parent approve/reject decisions and points awarded.

Actual Supabase Storage bucket policies are not part of Phase 3.

## Schedule

- `schedule_events`: family schedule entries, extracurriculars, appointments,
  sick/rest windows, parent blocked time, and chore/task schedule entries.

Kids may insert/update their own extracurricular entries. Parents can manage all
family schedule events.

## Swaps, Rewards, Points, Reminders

- `swap_requests`: sibling swap request and parent approval workflow.
- `reward_catalog`: family-owned non-monetary reward options.
- `reward_redemptions`: point redemption requests and parent review.
- `points_ledger`: immutable point changes. Do not rely only on mutable totals.
- `leaderboard_snapshots`: family-private constructive scoring snapshots.
- `reminders`: in-app reminder records.

## Settings And Audit

- `app_settings`: family-scoped JSON settings.
- `audit_events`: parent-visible audit trail for sensitive operations.

## RLS Summary

All app tables have RLS enabled.

Family-owned tables include `family_id`, except `profiles` and global starter
template tables. Policies use security-definer helper functions to resolve
membership without trusting client-provided role values.

Helper functions:

- `current_user_member_ids(family_id)`
- `current_user_is_family_member(family_id)`
- `current_user_has_family_role(family_id, roles)`
- `family_has_no_members(family_id)`
- `current_user_can_read_task(task_instance_id)`
- `current_user_can_submit_task(task_instance_id)`

Policy intent:

- parents manage family settings, members, templates, tasks, rewards, reviews,
  and audit records
- caregivers can read broad family data where allowed
- children read family schedule and their own task/submission data
- children can submit their own assigned tasks and evidence metadata
- children cannot approve submissions or manage chore templates/settings

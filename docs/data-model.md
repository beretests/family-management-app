# Data Model

Phase 3 adds the first Supabase Postgres schema for family-scoped app data.
Phase 4 wires the identity and family-member tables into the app UI. Phase 5
wires schedule events into app-facing day/week views. Phase 6 wires house
profiles and chore templates into parent-managed setup UI. Phase 8 wires
assigned tasks, checklist updates, submissions, and private evidence metadata
into the kid-facing task flow. Phase 9 wires parent review decisions and points
ledger entries into submitted task workflows. Phase 10 wires non-monetary
rewards, redemption review, point deductions, and a constructive family
leaderboard into the app UI. Phase 11 wires in-app reminders and evidence
retention cleanup into the existing reminder and evidence tables. Phase 14 adds
multi-member schedule attendance and parent profile editing. Phase 16 adds
adult family invitations and birthdate-based child age calculation.

## Identity And Families

- `profiles`: one row per Supabase Auth user. `id` matches `auth.users.id`.
- `families`: top-level family workspace.
- `family_members`: parent, caregiver, and child profiles inside a family.
  Children may have no Supabase Auth account in the MVP.
- `family_member_auth_links`: optional link from an auth profile to a family
  member, used for older kids or caregiver linking.
- `family_invitations`: parent-created pending, accepted, revoked, or expired
  invites for other parent/caregiver accounts.
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
- New and edited child profiles store month/year of birth in the existing
  `family_members.birthdate` column as the first day of the selected month.
  `age_years` remains only as legacy fallback data.
- Child profiles do not require Supabase Auth accounts when using Kid Mode.
- Kid Mode PIN hashes, failed-attempt counters, and lockout timestamps live in
  `family_member_pin_credentials`, which is restricted to active parents by RLS.
- Older kids may use real Supabase Auth accounts linked through
  `family_member_auth_links`.
- Parent-entered preferences and dislikes are stored in
  `family_member_preferences.notes` until chore templates exist.
- Removing a child from active use sets `lifecycle_status = 'inactive'` and
  `deactivated_at`; it does not hard-delete history.
- Sick, rest, and under-the-weather updates append
  `family_member_statuses` rows.

Adult invitation management:

- Parent-created adult invites create an inactive pending `family_members` row
  and a matching `family_invitations` row.
- The invited adult must sign in with the invited email address and accept the
  invite before `profile_id` and `family_member_auth_links` are attached.
- Revoking a pending invite marks the invite revoked and deactivates the
  unaccepted adult member.
- Deactivating an accepted adult revokes auth links and preserves history.

## House And Chores

- `house_profiles`: room and home-feature counts used for generation.
- `rooms`: optional room inventory.
- `starter_chore_templates`: global reference chore library seeded from the
  product spec.
- `starter_chore_template_subtasks`: global reference subtasks.
- `chore_templates`: family-owned editable chore templates.
- `chore_template_subtasks`: family-owned template checklist items.

Starter templates are not family-owned. Phase 6 copies matching starter rows
into `chore_templates` when parents configure their house and run generation.
The copy is editable by parents and includes subtasks, frequency, difficulty,
points, minimum age, review/evidence flags, undesirable score, completion
checks, and safety notes.

Generation behavior:

- `house_profiles` stores counts and feature flags used by deterministic rules.
- The generator maps house features to currently seeded starter templates.
- Existing family templates are skipped by exact title to avoid duplicate
  generation.
- Optional house features without seeded starter templates, such as yard,
  garden, garage, car chores, grocery errands, and pets, are stored for future
  expansion but do not currently generate extra templates.
- Phase 6 does not create task instances or assignments.

## Tasks And Reviews

- `task_instances`: generated or manual chore assignments with denormalized
  snapshots for historical accuracy. Phase 8 adds evidence and completion-check
  snapshots used when kids submit work.
- `task_instance_subtasks`: checklist items for task instances.
- `task_submissions`: kid completion submissions.
- `task_evidence_files`: private Supabase Storage metadata for evidence uploads.
- `task_reviews`: parent approve/reject decisions and points awarded.
- `points_ledger`: immutable point entries written when approved task reviews
  award points.

Phase 8 creates a private `task-evidence` Storage bucket with object policies
that allow assigned members to upload evidence and task readers to create
short-lived signed previews.

Phase 9 uses `task_reviews` for every parent decision. Approval sets
`task_instances.status = 'approved'`, stores awarded points on the task, and
adds a `points_ledger` row with `source = 'task_review'`. Rejection sets
`task_instances.status = 'rejected'`, increments `rejection_count`, stores
supportive feedback in `rejection_reason`, and keeps the task resubmittable.

## Schedule

- `schedule_events`: family schedule entries, extracurriculars, appointments,
  sick/rest windows, parent blocked time, and chore/task schedule entries.
- `schedule_event_members`: optional attendee rows for schedule events assigned
  to one or more specific family members.

Phase 5 uses the existing `schedule_events` table without adding a migration.
Parent Server Actions create, update, and delete rows after resolving active
parent membership server-side. Assigned `member_id` values are checked against
active family members before write attempts. Day/week reads are constrained by
`family_id`, `starts_at`, and `ends_at`; RLS still decides whether the
authenticated user can read the family schedule.

Kids may insert/update their own extracurricular entries at the RLS layer, but
the Phase 5 UI exposes parent-managed schedule CRUD only. Child-facing schedule
entry remains future scope.

Phase 14 keeps `schedule_events.member_id` for compatibility with older rows
and child-owned extracurricular policies, but parent-managed multi-member events
now write their attendee set to `schedule_event_members`. An event with no
attendee rows is treated as a whole-family event. Event counters should count
unique `schedule_events.id` values so a multi-member event displayed in several
lanes is still counted once.

Phase 14 also adds the schedule event types `parent_away` and
`parent_activity`. These represent parent availability or parent-only plans that
can affect chore timing without implying a child assignment.

## Swaps, Rewards, Points, Reminders

- `swap_requests`: sibling swap request and parent approval workflow.
- `reward_catalog`: family-owned non-monetary reward options.
- `reward_redemptions`: point redemption requests and parent review.
- `points_ledger`: immutable point changes. Do not rely only on mutable totals.
- `leaderboard_snapshots`: family-private constructive scoring snapshots.
- `reminders`: in-app reminder records.

Phase 10 uses the existing reward tables without a migration. Parents manage
the reward catalog, kids with linked child auth profiles can request active
rewards when their current `points_ledger` balance is high enough, and parents
approve or reject each redemption. Approval writes a negative immutable
`points_ledger` row with `source = 'reward_redemption'`.

The Phase 10 leaderboard is computed live from readable ledger entries and
active child profiles. It blends approved chore count, earned task points,
saved balance, and reward use into a private progress score instead of ranking
only by raw point totals. The `leaderboard_snapshots` table remains reserved for
future periodic snapshots.

Phase 11 writes reminder records for due-soon chores, overdue chores, submitted
chores waiting for review, rejected chores needing correction, and reward
redemptions waiting for approval. Reminder reads stay scoped by existing RLS:
parents/caregivers can read family reminders, and children can read their own
member reminders.

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
- children with linked auth profiles can request their own rewards through
  existing redemption insert policy and read their own redemption/ledger rows
- children cannot approve submissions or manage chore templates/settings

# Product Decisions

This document records product rules reflected in the Phase 3 schema.

## Child Accounts

Children are `family_members` first, not required Supabase Auth users.
`family_member_auth_links` supports older kids or caregivers who link a
Supabase Auth account to a family member.

Kid Mode/PIN is parent-managed household profile switching. PINs are hashed in
`family_member_pin_credentials`, the active child profile is stored in a signed
HttpOnly cookie, and PINs must not be treated as full account security.

## Starter Chores

The starter chore library is global reference data:

- `starter_chore_templates`
- `starter_chore_template_subtasks`

Parents will later copy or generate editable family-owned rows in
`chore_templates`. This avoids seeding fake family data and keeps the starter
library reusable.

## Fairness

The schema stores the data needed for deterministic assignment:

- age and ability on `family_members`
- disliked/preferred chores on `family_member_preferences`
- sick/rest status on `family_member_statuses`
- task difficulty, minutes, points, and undesirable flags on templates and
  instances
- completion, rejection, and point history through task/review/ledger tables
- human-readable `assignment_reason` on `task_instances`

The scoring engine itself is Phase 7 scope.

## Rewards

Rewards are family-owned and non-monetary by default. The schema supports point
costs, age bands, parent approval, and fulfillment state.

## Evidence

Phase 3 stores evidence metadata only. Supabase Storage bucket creation,
policies, signed URL access, compression, and retention cleanup are later phase
work.

## Privacy

The schema is family-scoped and RLS-protected. Child data is not public, and
leaderboard snapshots are family-private.

Avoid storing child photos longer than needed. The default retention target for
future evidence files remains 30 days after approve/reject unless the owner
changes it.

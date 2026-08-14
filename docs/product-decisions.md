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

## Calendar-Only Rollout

Calendar is the default product surface. With `ENABLE_FULL_APP` omitted or set
to `false`, the public messaging, signed-in navigation, and protected feature
routes expose Calendar only. Authentication, invitation acceptance, initial
family/member setup, and API/cron infrastructure remain available because they
support the calendar and account lifecycle.

Setting `ENABLE_FULL_APP=true` restores the existing dashboard, chores,
assignments, approvals, rewards, leaderboard, reminders, family-settings
navigation, and Kid Mode without deleting or migrating any feature data.
Calendar offers a
whole-family view and a view for each active family member. An individual view
includes events assigned to that member and events assigned to the whole
family. Calendar-only mode opens on Week by default to provide the at-a-glance
layout; the full app retains its existing Day default.

## Recurring Schedule Events

Phase 19 stores one recurrence definition per schedule event and generates only
the occurrences needed for the visible day or week. Supported choices are
daily, weekly, yearly, and custom weekdays (with Monday-Friday selected by
default for custom). Series can run indefinitely, end on a date, or stop after
a chosen occurrence count. The event's browser IANA time zone is stored so its
local time remains stable through daylight-saving transitions.

Series editing and deletion apply to the entire series. Exceptions and
single-occurrence edits remain deferred. All active family members can add
events, but non-parents can assign/edit only their own events; only parents can
delete schedule events.

## ICS Import

Phase 20 uses a preview-first `.ics` import. The browser parses for immediate
feedback, while the server reparses the uploaded bytes and rechecks actor and
attendee permissions before writing. Files are limited to 512 KB, previews to
500 events, and each confirmed import to 100 events. The source file is never
stored.

Parents may assign imported events to selected active members or the whole
family. Other active family members import only to themselves. A family-scoped
unique imported UID makes retries idempotent: duplicates are skipped, never
used to overwrite an existing event.

The import maps timed/all-day events, UTC/floating/IANA time zones, and the
app's daily, weekly, yearly, and custom-weekday recurrence subset. It reports
monthly/complex recurrence, exception dates, recurrence overrides, proprietary
time zones, and malformed required fields without blocking other supported
events. ICS export remains deferred. See `docs/ics-import.md` for the exact
compatibility rules.

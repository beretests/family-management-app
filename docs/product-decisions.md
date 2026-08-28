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

## Calendar And Grocery Rollout

Calendar and Groceries are the default shared surfaces. Active parents also see
Family settings so they can manage the household profiles those tools depend
on. Children and caregivers do not see the parent-only Family control. With
`ENABLE_FULL_APP` omitted or set to `false`, the remaining full-app feature
routes stay gated. Authentication,
invitation acceptance, initial family/member setup, and API/cron infrastructure
remain available because they support the shared tools and account lifecycle.

Setting `ENABLE_FULL_APP=true` restores the existing dashboard, chores,
assignments, approvals, rewards, leaderboard, reminders, and Kid Mode without
deleting or migrating any feature data.
Calendar offers a
whole-family view and a view for each active family member. An individual view
includes events assigned to that member and events assigned to the whole
family. Calendar opens on Week by default in the limited rollout to provide the at-a-glance
layout; the full app retains its existing Day default.

Phase 26 lets a parent invite an older child by email only by selecting that
child's existing profile and confirming guardian authority. Acceptance links
the new sign-in to that profile; it never creates a duplicate child. Kid Mode
remains available in parallel. Pending invite revocation and connected-account
disconnection preserve the child and history. Automatic invitation of an email
that already has an app account is deferred beyond this MVP.

## Grocery Shopping Lists

Phase 24 provides one open grocery list per family. Any active family member,
including a verified Kid Mode profile, can start the list when none exists and
can add, check, return, or remove its items. Parents alone complete, archive,
reopen, or permanently delete a whole list and hide or restore saved catalog
items.

Every newly typed grocery becomes a normalized, family-scoped catalog item.
Catalog names collapse surrounding/repeated spaces and compare
case-insensitively, preventing duplicates such as `Milk` and `milk`. List
items store name/category snapshots so old list history remains understandable
if the reusable catalog later changes. The MVP stores optional quantity, unit,
category, and note fields but does not model pantry inventory, prices, barcode
scanning, stores, or automatic stock depletion.

Completing or archiving a list sets its deletion date to 90 days later.
Reopening clears that date. The daily secured maintenance job hard-deletes only
closed lists whose date has passed; item rows cascade with the list while the
reusable catalog remains. Open lists are never automatically deleted.

## Recurring Schedule Events

Phase 19 stores one recurrence definition per schedule event and generates only
the occurrences needed for the visible day or week. Supported choices are
daily, weekly, yearly, and custom weekdays (with Monday-Friday selected by
default for custom). Series can run indefinitely, end on a date, or stop after
a chosen occurrence count. The event's browser IANA time zone is stored so its
local time remains stable through daylight-saving transitions.

Phase 22 offers three explicit scopes for recurring changes: this event, this
and following events, or the entire series. A single edit is stored as an
exception and a single delete as a cancellation. A following edit splits the
series at the selected local date; a following delete truncates it. Selecting
the first occurrence has the same result as changing the entire series. Earlier
exceptions stay with the earlier series and applicable exceptions move to the
new series. All active family members can add events, but non-parents can
assign/edit only their own events; only parents can delete schedule events.

The visible calendar time zone is the browser's IANA zone and is carried in the
schedule URL. Query boundaries, grid positions, labels, manual datetime saves,
and ICS previews use that same zone. Timestamps remain stored as UTC instants.

Calendar event cards are compact launch controls rather than a second details
surface. Selecting a timed or all-day event opens one accessible modal with its
full details and, when permitted, the existing edit/delete controls. Add-event
and calendar-import actions are buttons beside the calendar controls and open
their forms in accessible modals instead of expanding panels below the grid.

On phones, Day and Week use a date-grouped agenda so every event remains
readable without page-level or calendar-level horizontal scrolling. At the
desktop breakpoint, the existing time grid remains available for visual time
placement.

`No School` is a dedicated informational schedule type. It is always stored as
an all-day event, cannot be changed to a timed event, and does not count as a
schedule conflict or block chore assignment availability. All-day entries use
inclusive local calendar dates in the form and exclusive local-midnight UTC
boundaries in storage. In the desktop time grid, each all-day event shades its
day through all visible working-hour rows while retaining its labelled launch
control.

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
events. Imported recurrence exceptions remain deferred; app-created occurrence
overrides are supported independently. ICS export remains deferred. See `docs/ics-import.md` for the exact
compatibility rules.

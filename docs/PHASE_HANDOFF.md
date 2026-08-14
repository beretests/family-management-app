# Phase Handoff

## Current Phase

Phase 19: Recurring Schedule Events and Member Permissions

## Branch and Worktree

- Branch: `phase/19-recurring-schedule-events`
- Worktree: `../family-app-phase-19-recurring-schedule-events`
- Base branch: `main` at `5b76b5a` (`merge: integrate calendar-only family views`)

## Implemented Features

- Added repeat choices for daily, weekly, yearly, and custom weekdays, with
  Monday-Friday selected by default for the custom option.
- Added repeat intervals and series limits: never, through an end date, or for
  a chosen occurrence count.
- Stored the browser IANA time zone with each recurring series and preserved
  local wall-clock time across daylight-saving transitions.
- Added additive `schedule_event_recurrences` storage with family-scoped RLS,
  database constraints, indexes, and cascade cleanup when its parent event is
  deleted.
- Expanded recurring events only for the requested day/week range rather than
  materializing occurrence rows.
- Made recurring occurrences participate in member filters, event counts,
  duration totals, layout, and conflict detection.
- Kept editing anchored to the original series dates and made Phase 19 edits
  explicitly series-wide.
- Added an accessible date picker to jump directly to a past or future day/week;
  Previous, Today, and Next navigation remains available.
- Allowed every active family member to add schedule events.
- Restricted non-parents to self-assigned events that they created, for both
  create and edit actions and at the Postgres RLS layer.
- Kept event deletion parent-only at both the Server Action and RLS layers.
- Preserved Kid Mode isolation by resolving the signed child session before a
  validated server-only write, so the parent account behind Kid Mode does not
  grant parent schedule permissions to the child.
- Added recurrence, validation, SQL RLS, and browser-flow coverage.

## Manual Setup Still Required

- Apply `20260813170000_schedule_recurrence_permissions.sql` to each remote
  Supabase environment with the normal reviewed migration workflow.
- No Supabase dashboard setting, Vercel dashboard setting, new environment
  variable, paid service, or new package is required.
- Keep `SUPABASE_SECRET_KEY` and `CHILD_SESSION_SECRET` configured server-side
  if Kid Mode event creation is used, consistent with the existing Kid Mode
  architecture.
- Continue using `ENABLE_FULL_APP=false` (or omit it) for calendar-only mode;
  `ENABLE_FULL_APP=true` still restores the existing app features.

## Known Issues and Limitations

- Editing or deleting one occurrence independently is not supported; Phase 19
  applies changes to the whole series.
- ICS import/export is deferred to Phase 20.
- Week-view event cards remain glance-only. Switch to Day view to edit or delete
  a series.
- Recurrence expansion is intentionally bounded to 100 years and 1,000 explicit
  occurrences per series to prevent pathological requests.
- Existing all-day events still use the app's current start/end timestamp model.
- `npm ci` reports six high-severity advisories in the existing locked
  dependency tree. Phase 19 adds no dependency and did not run an automatic
  audit fix.

## Next Recommended Phase

- Phase 20: safe ICS file import with preview, validation, duplicate handling,
  supported recurrence mapping, and explicit reporting for unsupported rules.

## Checks

- Local Supabase migration applied successfully without resetting existing
  local data.
- `supabase db lint --local --level warning` passed with no schema errors.
- SQL verification passed: RLS enabled/family IDs present, non-parent self
  create/update allowed, sibling assignment rejected, non-parent delete blocked,
  and parent delete allowed. Test data was rolled back.
- Focused recurrence/schema tests passed: 2 files, 12 tests.
- Repository-wide lint passed.
- TypeScript passed with Node 24.3.
- Full unit/component suite passed: 29 files, 121 tests.
- Production build passed with Next.js 16.2.10 and retained every existing app
  route in the output.
- Full-app Playwright smoke passed: recurring event creation, display on a
  future date, occurrence-count stopping, and the existing chore generation,
  assignment, and My Today flows.
- Phase 19 files pass Prettier checks, and `git diff --check` passed.
- The first browser attempt omitted the local Supabase CLI from the pinned Node
  PATH; a later selector attempt exposed ambiguous `Ends`/loading-copy labels.
  The environment and selectors were corrected, then the smoke flow passed.

## Recommended Commit

`feat(schedule): add recurring events and member event creation`

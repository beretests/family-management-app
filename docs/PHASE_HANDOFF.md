# Phase Handoff

## Current Phase

Phase 22: Calendar Event Reliability and Recurring Edit Scopes

## Branch and Worktree

- Branch: `phase/22-calendar-event-fixes`
- Worktree: `../family-app-phase-22-calendar-event-fixes`
- Base branch: `main` at `bd69689` (Phase 21 merged locally)

## Implemented Features

- Added visible event detail/edit controls to both Day and Week calendar views.
- Added recurring edit and parent delete scopes for **This event**, **This and
  following events**, and **Entire series**.
- Stored single-occurrence edits/cancellations as family-scoped overrides rather
  than changing or materializing the complete series.
- Added atomic database functions for replacing one occurrence, splitting a
  series at a selected local date, and truncating the selected/following range.
- Preserved earlier exceptions during splits and moved applicable later
  exceptions to the newly created series.
- Kept event deletion parent-only while preserving creators' ability to edit
  their own self-assigned recurring events.
- Synchronized the browser IANA time zone into schedule URLs and used it for
  day/week query boundaries, grid layout, labels, manual saves, and ICS preview.
- Fixed manual `datetime-local` conversion so Vercel/server UTC cannot shift a
  saved local time by six hours.
- Explicitly refreshes schedule data after mutations and resets the create form
  after each successful save so additional entries can be submitted reliably.
- Added unit coverage for time-zone conversion/layout, recurrence overrides,
  occurrence numbering, and scope validation, plus transactional SQL coverage
  for RLS and atomic recurrence operations.

## Manual Setup Still Required

- Apply `20260826170000_schedule_occurrence_overrides.sql` to each Supabase
  environment with the normal reviewed migration workflow (`supabase db push`).
- Refresh the PostgREST schema cache if a remote project does not expose the new
  RPCs immediately after migration.
- No Supabase dashboard setting, Vercel dashboard change, environment variable,
  secret, paid service, Storage bucket, or production deployment is required.

## Known Issues and Limitations

- Imported ICS `EXDATE`, `RDATE`, `EXRULE`, and `RECURRENCE-ID` exceptions remain
  unsupported; Phase 22 exceptions apply to events edited inside the app.
- "This and following" edits must remain recurring. To turn only the selected
  occurrence into a one-time event, use **This event**.
- Calendar time-zone detection requires JavaScript. The first server render uses
  UTC until the client adds the browser zone to the URL, then replaces the view
  without scrolling.
- The existing locked dependency tree still reports six high-severity npm audit
  findings. This phase did not run an automatic audit fix or change dependency
  versions.

## Next Recommended Phase

- Review the calendar controls and recurrence scope wording in a browser, then
  merge after owner approval.
- A later ICS phase may add standards-compliant imported recurrence exceptions
  and export without changing the app-created override model.

## Checks

- Focused calendar coverage passed: 6 files, 30 tests.
- The additive migration applied successfully to local Supabase.
- Phase 22 SQL occurrence/RLS verification completed and rolled back cleanly.
- Existing schedule-permission, ICS-import, and repository RLS SQL verification
  also completed and rolled back cleanly.
- Repository-wide lint and TypeScript checks passed.
- Full unit/component suite passed: 34 files, 152 tests.
- Production build passed with Next.js 16.2.10 and includes `/schedule` in the
  dynamic route output.
- Every Phase 22 TypeScript and Markdown file passes Prettier, and
  `git diff --check` passes. The repository-wide Prettier check still reports 28
  unrelated pre-existing files; this phase did not rewrite them.

## Recommended Commit

`fix(schedule): add scoped recurring event controls and timezone-safe saves`

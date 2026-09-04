# Phase Handoff

## Current Phase

Phase 31: Schedule Civil Dates and Idempotent Saves

## Branch and Worktree

- Branch: `phase/31-schedule-civil-dates`
- Worktree: `../family-app-phase-31-schedule-civil-dates`
- Base branch: `main` at `b4abb40`

## Implemented Changes

- Kept selected calendar days and week columns as validated `YYYY-MM-DD`
  strings across the Server Component and Client Component boundary.
- Added timezone-independent civil-date validation, formatting, weekday, week
  boundary, and day-arithmetic helpers.
- Derived Day/Week query endpoints from explicit browser-zone midnights while
  preserving overlap reads for overnight and multi-day events.
- Updated desktop/mobile labels, event filtering, event positioning, previous
  and next navigation, date input values, and create defaults to use the same
  civil dates.
- Added one UUID idempotency key to every manual create form. Replayed keys
  return the original event ID without repeating attendee, recurrence, or audit
  writes.
- Removed the redundant `refresh()` call. A successful Server Action now uses
  one `/schedule` invalidation, and the modal closes only after the refreshed
  action response completes.
- Added schedule-specific refresh failure UI with a safe retry explanation.
- Made Playwright's development server inherit the supported Node executable
  that launched Playwright and set its browser timezone to `America/Regina`.

## Database and Platform Changes

- Added `20260904170000_schedule_event_idempotency.sql`.
- The migration adds nullable `schedule_events.idempotency_key uuid` and a
  unique `(family_id, created_by_member_id, idempotency_key)` constraint.
- Existing, generated, and imported rows may retain a null key. ICS import
  continues to use its existing family/source UID constraint.
- No RLS policy, grant, Storage bucket, Auth setting, Vercel setting, dependency,
  environment variable, or paid service changed.

## Manual Setup Still Required

- Apply `20260904170000_schedule_event_idempotency.sql` before deploying this
  application version, normally with `supabase db push`.
- Redeploy the app after the migration is present.
- No Supabase or Vercel dashboard setting is required.

## Known Issues and Limitations

- A fresh local `supabase db reset` exposes an older migration/grant gap before
  browser tests reach Calendar: `authenticated` lacks read access to
  `family_member_pin_credentials`.
- Existing schedule permission and ICS SQL checks also stop at `permission
denied for table schedule_event_members`; the table has RLS policies but its
  authenticated table privileges do not include the required operations.
- Those privilege gaps predate Phase 31 and were not changed because correcting
  them broadens database access and requires a separate approved security scope.
- The full Playwright flow was stopped after confirming the pre-Calendar grant
  blocker. Phase 31's browser assertions are committed but could not execute on
  the freshly reset schema.
- `npm audit` reports one high-severity transitive `browserslist` finding
  (`GHSA-c83g-rgw3-j3cx` and `GHSA-73wf-gq98-2v4g`) with a fix available.
  Dependency files were not changed because upgrades are outside this phase.
- The host defaults to unsupported Node 18. Final JavaScript checks used the
  available Node 24.3.0 runtime.

## Checks

- Current official Next.js 16.3.3 local guidance for forms, Server Actions,
  `revalidatePath`, and `refresh` was reviewed.
- Current official Supabase migration guidance was reviewed.
- Clean dependency installation was repaired under Node 24 to include native
  optional build packages.
- `npm audit --json` completed and reported the one transitive `browserslist`
  finding described above.
- TypeScript checking passed.
- Repository-wide lint passed.
- Every Phase 31 file passed the Prettier check. The repository-wide Prettier
  check still reports 22 unchanged pre-existing files.
- Full unit/component suite passed: 45 files, 196 tests.
- Focused Phase 31 date/layout/grid/form/action/error tests passed: 9 files, 39
  tests.
- Local `supabase db reset` applied every migration, including Phase 31, and
  seeded successfully.
- Phase 31 SQL idempotency verification passed and rolled back.
- Existing schedule permission/ICS SQL verification failed on the pre-existing
  `schedule_event_members` table-privilege gap described above.
- Regina Playwright testing was blocked before Calendar by the pre-existing
  `family_member_pin_credentials` table-privilege gap described above.
- Production build passed with Next.js 16.3.3 under Node 24.3.0.
- `git diff --check` passed.

## Next Recommended Action

- Review and commit Phase 31, then merge it after owner approval.
- Plan a separate security-reviewed phase to reconcile authenticated table
  grants with the existing RLS policies on post-Phase-3 tables, rerun every SQL
  verification file from a clean reset, and then run the full Playwright suite.

## Recommended Commit

`fix(schedule): preserve civil dates and idempotent saves`

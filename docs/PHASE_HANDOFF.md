# Phase Handoff

## Current Phase

Phase 5: Family Schedule

## Branch and Worktree

- Branch: `phase/05-schedule`
- Worktree: `../family-app-phase-05-schedule`
- Base branch: local `main` at `e301ce9` (`Merge branch 'phase/04-family-profiles'`)

## Implemented Features

- Added `/schedule` as a protected App Router page with day and week views.
- Added date navigation for previous, today, and next ranges.
- Added parent-only schedule event creation, editing, and deletion.
- Added Zod validation for schedule event forms, event types, date ranges,
  optional member assignment, optional color, notes, and location.
- Added server-side parent permission checks before schedule writes.
- Added server-side validation that assigned `member_id` values belong to
  active members of the current family.
- Reused the existing `schedule_events` schema and RLS policies; no migration
  was added.
- Added same-member overlap detection and conflict badges.
- Added family member lanes, member colors, whole-family events, and rest/sick
  status visibility.
- Added a dashboard preview for today's schedule events.
- Added Schedule to the protected app navigation.
- Added unit tests for schedule validation and conflict detection.
- Added Playwright E2E setup and `npm run test:e2e`.
- Added a guarded local-only `/api/test/session` route for E2E session setup;
  it returns 404 unless `E2E_TEST_AUTH_ENABLED=true`.
- Added a browser smoke test for local parent session setup, family setup, child
  creation, and schedule event creation.
- Updated architecture, data model, and local development docs for Phase 5.

## Manual Setup Still Required

- Apply existing migrations locally or remotely before using the schedule UI:

```bash
supabase db reset
```

- For a linked remote project, review migrations and apply when ready:

```bash
supabase db push
```

- `supabase db reset` was not run during this phase handoff to avoid deleting
  local development data without explicit approval.
- No Supabase dashboard change is required for this phase.
- No Vercel dashboard change is required for this phase.
- E2E tests require local Supabase to be running with migrations applied. The
  test runner reads local service-role credentials from environment variables or
  `supabase status -o env`; do not commit real service-role values.

## Known Issues and Limitations

- Child-facing schedule entry is not exposed in the UI yet, although the RLS
  layer already allows kids to manage their own extracurricular entries.
- The schedule supports day and week views only; month view is future scope.
- Events use simple local date/time inputs. There is no timezone preference UI.
- Conflict detection flags overlapping events for the same member only.
- Chore generation, assignment scheduling, reminders, evidence storage,
  rewards, points, and cron cleanup are not implemented yet.
- E2E coverage currently verifies schedule creation only. Schedule edit/delete
  browser coverage remains future scope.

## Next Recommended Phase

Phase 6: Chore Templates

Expected branch and worktree:

- Branch: `phase/06-chore-templates`
- Worktree: `../family-app-phase-06-chore-templates`

## Checks

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 6 files, 20 tests.
- `npm run test:e2e` passed: 1 browser smoke test.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/dashboard`
  - `/family/setup`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `psql postgresql://postgres:postgres@127.0.0.1:55422/postgres -v ON_ERROR_STOP=1 -f tests/sql/rls-verification.sql`
  passed:
  - app tables without RLS: 0
  - family-owned tables missing `family_id`: 0
  - starter chore templates seeded: 14
  - authenticated initial parent bootstrap insert: passed and rolled back

Environment note: the Phase 5 worktree reused dependencies from the main
checkout for verification. A temporary `node_modules` symlink was rejected by
Turbopack, so a real local copy was used for `npm run build`.

# Phase Handoff

## Current Phase

Phase 14: Schedule and Parent Profile Polish

## Branch and Worktree

- Branch: `phase/14-schedule-parent-profile`
- Worktree: `../family-app-phase-14-schedule-parent-profile`
- Base branch: `main` at `e2f988a` (`feat(auth): add parent-managed kid mode with PIN sessions`)

## Implemented Features

- Added `parent_away` and `parent_activity` schedule event types.
- Added `schedule_event_members` for parent-managed schedule events assigned to
  multiple selected family members.
- Kept legacy `schedule_events.member_id` compatibility while reading attendee
  rows from the new join table.
- Updated schedule day/week lanes so multi-member events appear for each
  selected attendee and whole-family events remain shared.
- Updated schedule metrics to count unique event IDs rather than lane
  appearances.
- Collapsed the add-schedule form by default.
- Added client and server validation so end date/time stays after start
  date/time, with a one-hour default duration when start changes.
- Added current-parent display-name editing from Family settings.
- Updated assignment and conflict logic to use schedule attendee arrays.
- Updated unit coverage for schedule schemas, conflicts, assignment conflicts,
  and unique event metrics.

## Manual Setup Still Required

- Apply Supabase migration
  `20260714190000_schedule_event_members.sql`.
- Confirm the remote database accepts the new `schedule_event_type` enum values
  `parent_away` and `parent_activity`.
- Redeploy after the migration so the app and database schema agree.

## Known Issues and Limitations

- The existing child-owned extracurricular RLS path still relies on
  `schedule_events.member_id`; this phase keeps multi-member schedule creation
  parent-managed.
- Existing single-member events are backfilled into `schedule_event_members`
  when the migration runs.
- Whole-family events are represented by no attendee rows, so server actions
  must continue treating an empty attendee set as whole-family rather than
  unassigned.

## Next Recommended Phase

Owner-directed hardening after merge:

- `phase/15-schedule-kid-writes`: update child/Kid Mode schedule creation for
  child-owned extracurricular entries against the multi-member event model.
- `phase/15-kid-mode-e2e`: browser smoke tests for PIN unlock, child task
  submission, parent-only redirects, and exit.

## Checks

- `npm install` passed in the Phase 14 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed with worktree write permission for
  `tsconfig.tsbuildinfo`.
- `npm test` passed: 22 files, 71 tests.
- Initial `npm run build` failed because the sandbox could not create `.next` in
  the sibling worktree.
- `npm run build` passed with worktree write permission.

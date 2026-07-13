# Phase Handoff

## Current Phase

Phase 9: Parent Review and Points Ledger

## Branch and Worktree

- Branch: `phase/09-parent-review-points`
- Worktree: `../family-app-phase-09-parent-review-points`
- Base branch: local `main` at `4cfc08c` (`Merge branch 'phase/08-kid-submissions'`)

## Implemented Features

- Added `/approvals` as a parent-only review queue.
- Added review cards with submitted task details, child name, checklist state,
  note, evidence previews, point value, and submitted time.
- Added approve action that creates `task_reviews`, writes immutable
  `points_ledger` entries, updates task status to `approved`, stores
  `points_awarded`, and writes audit events.
- Added reject action that creates `task_reviews`, updates task status to
  `rejected`, increments `rejection_count`, stores supportive feedback, and
  writes audit events.
- Added recommended point calculation that awards full points on first approval
  and reduced points after previous rejection.
- Added Approvals to app navigation and dashboard pending-review summary.
- Added unit tests for review schemas and point ledger calculations.

## Manual Setup Still Required

- No new Supabase migration is required for Phase 9.
- Existing Phase 8 migrations must be applied before evidence previews work.
- No Supabase dashboard change is required for this phase.
- No Vercel dashboard change is required for this phase.
- No production deployment was performed.

## Known Issues and Limitations

- Approval/rejection writes are performed through server actions using existing
  parent RLS policies; they are not wrapped in a custom database transaction.
- Rewards, redemptions, and leaderboard remain Phase 10 scope.
- Evidence cleanup remains Phase 11 scope.
- E2E smoke coverage still focuses on getting tasks to My Today; full
  parent-review browser coverage should be added when a child auth flow is
  available in tests.

## Next Recommended Phase

Phase 10: Rewards and Leaderboard

Expected branch and worktree:

- Branch: `phase/10-rewards-leaderboard`
- Worktree: `../family-app-phase-10-rewards-leaderboard`

## Checks

- `npm install` passed in the Phase 9 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 14 files, 48 tests.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/approvals`
  - `/assignments`
  - `/chores`
  - `/dashboard`
  - `/family/setup`
  - `/my-today`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `tests/sql/rls-verification.sql` passed locally:
  - app tables without RLS: 0
  - family-owned tables missing `family_id`: 0
  - starter chore templates seeded: 14
  - authenticated initial parent bootstrap insert: passed and rolled back
- `npm run test:e2e` passed: 1 browser smoke test covering family setup, child
  creation, schedule event creation, chore template generation, assignment
  creation, and My Today task rendering.

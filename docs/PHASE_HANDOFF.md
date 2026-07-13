# Phase Handoff

## Current Phase

Phase 10: Rewards and Leaderboard

## Branch and Worktree

- Branch: `phase/10-rewards-leaderboard`
- Worktree: `../family-app-phase-10-rewards-leaderboard`
- Base branch: local `main` at `cb7d121` (`Merge branch 'phase/09-parent-review-points'`)

## Implemented Features

- Added `/rewards` with parent-managed non-monetary reward catalog creation and
  editing.
- Added child reward request flow for linked child auth profiles with point
  affordability checks against the immutable ledger.
- Added parent approval/rejection for reward redemption requests. Approval
  deducts points with a negative `points_ledger` row and records audit events.
- Added reward history and dashboard reward request/active reward summaries.
- Added `/leaderboard` with a family-private constructive progress score based
  on approved chores, earned task points, saved balance, and reward usage rather
  than raw point totals alone.
- Added Rewards and Leaderboard to app navigation.
- Added unit tests for reward schemas and leaderboard scoring.

## Manual Setup Still Required

- No new Supabase migration is required for Phase 10.
- Existing Phase 3 through Phase 8 migrations must be applied before rewards,
  points, and evidence-backed task flows work.
- No Supabase dashboard change is required for this phase.
- No Vercel dashboard change is required for this phase.
- No production deployment was performed.

## Known Issues and Limitations

- Reward approval writes update `reward_redemptions` and insert a deduction in
  `points_ledger` through server actions using existing parent RLS policies;
  they are not wrapped in a custom database transaction.
- Child reward requests require a linked child auth profile. Parent-managed Kid
  Mode/PIN profile switching remains future scope.
- The leaderboard is computed live; `leaderboard_snapshots` is not populated
  until a future scheduled snapshot phase.
- Evidence cleanup remains Phase 11 scope.
- E2E smoke coverage still focuses on the parent flow; child reward redemption
  browser coverage should be added when a child auth flow is available in tests.

## Next Recommended Phase

Phase 11: Reminders and Evidence Cleanup

Expected branch and worktree:

- Branch: `phase/11-reminders-cleanup`
- Worktree: `../family-app-phase-11-reminders-cleanup`

## Checks

- `npm install` passed in the Phase 10 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed after rerunning with worktree write permission for
  `tsconfig.tsbuildinfo`.
- `npm test` passed: 16 files, 54 tests.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/approvals`
  - `/assignments`
  - `/chores`
  - `/dashboard`
  - `/family/setup`
  - `/leaderboard`
  - `/my-today`
  - `/rewards`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `npm run test:e2e` was not run for Phase 10 because the existing E2E suite
  exercises the parent setup/task flow, while child reward requests require a
  linked child auth flow that is not yet covered.

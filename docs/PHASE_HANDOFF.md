# Phase Handoff

## Current Phase

Phase 11: Reminders and Evidence Cleanup

## Branch and Worktree

- Branch: `phase/11-reminders-cleanup`
- Worktree: `../family-app-phase-11-reminders-cleanup`
- Base branch: local `main` at `0941b21` (`Merge branch 'phase/10-rewards-leaderboard'`)

## Implemented Features

- Added `/reminders` as an in-app reminder center.
- Added reminder generation for due-soon chores, overdue chores, submitted
  chores waiting for parent review, rejected chores needing correction, and
  reward redemptions waiting for approval.
- Added optional browser Notification API prompt without SMS, email, paid push,
  or external messaging providers.
- Added dashboard reminder count and today/tomorrow reminder summary.
- Added secured daily maintenance route at `/api/cron/daily-maintenance`.
- Added `vercel.json` with one daily Vercel Cron entry.
- Added evidence cleanup utilities that delete old reviewed evidence from the
  private `task-evidence` bucket and remove matching metadata.
- Added unit tests for reminder generation and evidence cleanup eligibility.

## Manual Setup Still Required

- No new Supabase migration is required for Phase 11.
- Existing migrations must be applied before reminders and evidence cleanup work.
- No Supabase dashboard change is required for this phase.
- Vercel requires `CRON_SECRET` and a server-only Supabase admin key before the
  daily maintenance route can run after deployment.
- No production deployment was performed.

## Known Issues and Limitations

- Cron timing is daily/low-frequency and should not be treated as exact on
  Vercel Hobby.
- Reminder dismissal uses server-side permission checks and the server-only
  Supabase admin key because existing RLS only allows parents to update
  reminders.
- Evidence cleanup is batch-limited and deletes Storage objects before metadata.
- Browser notifications are local browser alerts only; background push is not
  implemented.
- Email and SMS reminders are intentionally not implemented.

## Next Recommended Phase

Phase 12: Deployment Polish

Expected branch and worktree:

- Branch: `phase/12-deployment-polish`
- Worktree: `../family-app-phase-12-deployment-polish`

## Checks

- `npm install` passed in the Phase 11 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed after fixing browser notification component React purity
  issues.
- `npm run typecheck` passed with worktree write permission for
  `tsconfig.tsbuildinfo`.
- `npm test` passed: 18 files, 61 tests.
- `npm run build` passed and included routes:
  - `/api/cron/daily-maintenance`
  - `/api/test/session`
  - `/approvals`
  - `/assignments`
  - `/chores`
  - `/dashboard`
  - `/family/setup`
  - `/leaderboard`
  - `/my-today`
  - `/reminders`
  - `/rewards`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `npm run test:e2e` was not run for Phase 11 because the existing E2E smoke
  flow does not seed or exercise generated reminder rows or cron execution.

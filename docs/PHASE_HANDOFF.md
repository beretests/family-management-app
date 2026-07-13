# Phase Handoff

## Current Phase

Phase 7: Fair Assignment Engine

## Branch and Worktree

- Branch: `phase/07-assignment-engine`
- Worktree: `../family-app-phase-07-assignment-engine`
- Base branch: local `main` at `9fdf62e` (`Merge branch 'phase/06-chore-templates'`)

## Implemented Features

- Added `/assignments` as a protected parent-facing assignment planning page.
- Added a deterministic assignment engine for active chore templates and active
  child profiles.
- Scoring now considers age range, ability level, sick/rest/under-the-weather
  status, schedule conflicts, recent workload, recent undesirable chores, and
  preference notes that mention the chore or area.
- Added explainable candidate scoring with parent-visible assignment reasons,
  warnings, blockers, and candidate detail disclosure.
- Added parent override support before assignments are created.
- Added task creation from selected previews into `task_instances` with
  `status = assigned`, due time, available-from time, point/difficulty/minute
  snapshots, undesirable flag, subtask JSON snapshot, and `assignment_reason`.
- Added `task_instance_subtasks` rows from template subtasks.
- Added duplicate prevention for already-created active assignments for the
  same template on the selected day.
- Added audit event `task_assignments.created`.
- Added Assignments to app navigation and dashboard summary.
- Added focused unit tests for engine eligibility, schedule penalties, workload
  balancing, undesirable rotation, preference notes, subtask snapshots, and
  assignment form validation.

## Manual Setup Still Required

- No new Supabase migration is required for Phase 7.
- Existing Phase 3 schema and RLS must already be applied because this phase
  writes to `task_instances`, `task_instance_subtasks`, and `audit_events`.
- No Supabase dashboard change is required for this phase.
- No Vercel dashboard change is required for this phase.
- E2E tests still require local Supabase to be running with migrations and seed
  data applied.

## Known Issues and Limitations

- Assignments are parent-facing only. Kid "My Today", checklist completion,
  submissions, and evidence upload remain Phase 8 scope.
- Completion history is represented by recent active task workload; richer
  completion/rejection history weighting should come after submissions and
  reviews exist.
- Dependencies are not blocked yet beyond template availability; dependency
  enforcement should be revisited when task execution states are implemented.
- The page uses a fixed assignment window of 3:00 PM to 8:00 PM and fixed due
  time of 6:00 PM for MVP simplicity.
- Parent overrides are validated against active child profiles and active
  templates, but the persisted reason comes from the preview text.

## Next Recommended Phase

Phase 8: Kid Task Experience and Submissions

Expected branch and worktree:

- Branch: `phase/08-kid-submissions`
- Worktree: `../family-app-phase-08-kid-submissions`

## Checks

- `npm install` passed in the Phase 7 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 10 files, 33 tests.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/assignments`
  - `/chores`
  - `/dashboard`
  - `/family/setup`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `npm run test:e2e` was not run for this phase; Phase 7 coverage is focused on
  unit-tested assignment rules and build verification.

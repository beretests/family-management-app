# Phase Handoff

## Current Phase

Phase 8: Kid Task Experience and Submissions

## Branch and Worktree

- Branch: `phase/08-kid-submissions`
- Worktree: `../family-app-phase-08-kid-submissions`
- Base branch: local `main` at `9b32e28` (`Merge branch 'phase/07-assignment-engine'`)

## Implemented Features

- Added `/my-today` for today task viewing and submission.
- Added kid task cards with due window, points, difficulty, assignment reason,
  evidence requirement, checklist progress, rejection feedback, and signed
  evidence previews.
- Added checklist update actions for assigned members.
- Added task submission with optional note and required note/photo validation
  when task snapshots require evidence.
- Added private evidence uploads to Supabase Storage with metadata in
  `task_evidence_files`.
- Added short-lived signed URL generation for evidence previews.
- Added linked-member context resolution for older kid auth accounts through
  `family_member_auth_links`.
- Added additive task snapshot columns for evidence and completion checks.
- Added private `task-evidence` bucket migration and narrow Storage policies.
- Added a security-definer `submit_task_instance` function so children do not
  need broad `task_instances` update privileges.
- Added My Today to app navigation and dashboard.
- Added unit tests for task schemas and evidence storage helpers.

## Manual Setup Still Required

- Apply the new migration locally or remotely before evidence uploads work:

```bash
supabase db reset
```

For a linked remote project, review and apply with:

```bash
supabase db push
```

- Confirm the Supabase `task-evidence` bucket is private.
- No Vercel dashboard change is required for this phase.
- No production deployment was performed.

## Known Issues and Limitations

- Parent approve/reject, points ledger writes, and rewards remain Phase 9+.
- Evidence cleanup is documented but not automated until the cleanup phase.
- Parent/caregiver `/my-today` is a read-only family view; checklist and submit
  controls require signing in as the assigned child profile.
- Existing assignments created before this migration have evidence snapshots
  defaulting to not required.

## Next Recommended Phase

Phase 9: Parent Review and Points Ledger

Expected branch and worktree:

- Branch: `phase/09-parent-review-points`
- Worktree: `../family-app-phase-09-parent-review-points`

## Checks

- `npm install` passed in the Phase 8 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 12 files, 40 tests.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/assignments`
  - `/chores`
  - `/dashboard`
  - `/family/setup`
  - `/my-today`
  - `/schedule`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`
- `supabase migration up` passed locally and applied
  `20260713150000_task_evidence_storage.sql`.
- `tests/sql/rls-verification.sql` passed locally:
  - app tables without RLS: 0
  - family-owned tables missing `family_id`: 0
  - starter chore templates seeded: 14
  - authenticated initial parent bootstrap insert: passed and rolled back
- Storage verification passed locally:
  - `task-evidence` bucket exists
  - bucket is private
  - file size limit is 5 MB
  - insert/select Storage object policies exist
- `npm run test:e2e` passed: 1 browser smoke test covering family setup, child
  creation, schedule event creation, chore template generation, assignment
  creation, and My Today task rendering.

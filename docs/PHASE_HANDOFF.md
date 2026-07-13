# Phase Handoff

## Current Phase

Phase 6: Chore Templates and House-Based Generation

## Branch and Worktree

- Branch: `phase/06-chore-templates`
- Worktree: `../family-app-phase-06-chore-templates`
- Base branch: local `main` at `f498461` (`Merge branch 'phase/05-schedule'`)

## Implemented Features

- Added `/chores` as a protected parent-facing chore template setup page.
- Added house profile form for room counts and home-feature flags.
- Added deterministic chore generation from existing seeded
  `starter_chore_templates`.
- Added duplicate prevention by skipping generated templates whose title already
  exists in the family chore library.
- Added parent-managed chore template create, update, and delete flows.
- Added editable chore fields for subtasks, frequency, points, difficulty,
  minimum/maximum age, parent review, evidence, undesirable score, completion
  check, safety notes, category, location, and active state.
- Added starter chore library display.
- Added Chores to app navigation and dashboard summary.
- Extended the Playwright smoke test to cover generated family chore templates.
- Added unit tests for house/chore validation and deterministic generation.
- Updated architecture, data model, and local development docs.

## Manual Setup Still Required

- Apply existing migrations and seed data locally or remotely before using chore
  generation:

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
- E2E tests require local Supabase to be running with migrations and seed data
  applied. Playwright starts the app on `http://127.0.0.1:3106` by default.

## Known Issues and Limitations

- Optional profile flags for yard, garden, garage, car chores, grocery errands,
  and pets are stored but do not generate templates yet because the current
  starter seed does not include those chores.
- Generation copies starter templates only; it does not create task instances or
  assignments.
- Deleting templates is allowed in Phase 6 because task history does not exist
  yet. Later task phases may need soft-delete-only behavior.
- Dependency links are populated only when the dependency starter is also
  present in the family library.
- E2E covers generation, but not manual template edit/delete.

## Next Recommended Phase

Phase 7: Fair Assignment Engine

Expected branch and worktree:

- Branch: `phase/07-assignment-engine`
- Worktree: `../family-app-phase-07-assignment-engine`

## Checks

- `npm install` passed in the Phase 6 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npm run lint` passed.
- `npm run typecheck` passed after dependency alignment.
- `npm test` passed: 8 files, 26 tests.
- `npm run test:e2e` passed: 1 browser smoke test covering family setup, child
  creation, schedule event creation, and chore template generation.
- `npm run build` passed and included routes:
  - `/api/test/session`
  - `/chores`
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

# Phase Handoff

## Current Phase

Phase 4: Family and Child Profile Management

## Branch and Worktree

- Branch: `phase/04-family-profiles`
- Worktree: `../family-app-phase-04-family-profiles`
- Base branch: local `main` at `a95a390` (`Merge branch 'phase/03-db-rls'`)

## Implemented Features

- Added `/family/setup` for first signed-in parent family bootstrap.
- Added `/settings/family` for parent-managed family profiles.
- Connected `/dashboard` to real family context.
- Added parent profile, family creation, child profile creation, child profile
  update, child deactivation, and status update Server Actions.
- Added server-side active-parent permission resolution in `lib/permissions`.
- Added Zod validation for family setup, child profile, deactivation, and
  status forms.
- Added parent-managed child preferences/dislikes notes through
  `family_member_preferences.notes`.
- Added sick, rest-day, under-the-weather, and normal status writes through
  `family_member_statuses`.
- Added soft deactivation by setting `family_members.lifecycle_status` and
  `deactivated_at`; no child history is hard-deleted.
- Added a Phase 4 RLS migration for initial parent bootstrap:
  `20260708190000_fix_initial_family_member_bootstrap.sql`.
- Extended SQL verification with a rollback-only authenticated bootstrap check.
- Added unit tests for family validation schemas.
- Updated README, architecture, local dev, Supabase setup, and data-model docs.

## Manual Setup Still Required

- Apply migrations locally or remotely before testing app-facing family writes:

```bash
supabase db reset
```

- For a linked remote project, review the Phase 4 migration and then apply:

```bash
supabase db push
```

- This repo uses non-default local Supabase ports to avoid conflicts with other
  local projects: API `55421`, database `55422`, Studio `55423`, email testing
  `55424`, SMTP `55425`, POP3 `55426`, analytics `55427`, and shadow database
  `55420`.
- No Vercel dashboard change is required for this phase.

## Known Issues and Limitations

- Kid Mode/PIN and child Supabase Auth accounts are not implemented yet.
- Family UI supports one current family for the MVP.
- Preferences and disliked chores are captured as parent notes until chore
  templates exist in Phase 6.
- Schedule, chore generation, assignments, evidence storage, rewards, points,
  reminders, and cron cleanup are not implemented yet.
- RLS is verified with SQL checks, but there are no automated browser E2E tests
  for sign-in plus family setup.
- `SUPABASE_SECRET_KEY` remains server-only and is not used by Phase 4 app code.

## Next Recommended Phase

Phase 5: Family Schedule

Expected branch and worktree:

- Branch: `phase/05-schedule`
- Worktree: `../family-app-phase-05-schedule`

## Checks

- `npm install` completed in the Phase 4 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `supabase db reset` passed and applied:
  - `20260708170000_initial_family_schema.sql`
  - `20260708190000_fix_initial_family_member_bootstrap.sql`
  - `supabase/seed.sql`
- Rollback-only direct RLS bootstrap check passed after the Phase 4 migration.
- `psql postgresql://postgres:postgres@127.0.0.1:55422/postgres -v ON_ERROR_STOP=1 -f tests/sql/rls-verification.sql`
  passed:
  - app tables without RLS: 0
  - family-owned tables missing `family_id`: 0
  - starter chore templates seeded: 14
  - authenticated initial parent bootstrap insert: passed and rolled back
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 4 files, 12 tests.
- `npm run build` passed and included routes:
  - `/dashboard`
  - `/family/setup`
  - `/settings/family`
  - `/sign-in`
  - `/sign-up`

Environment note: local verification used Supabase CLI `2.84.2`; the CLI
reported that `2.109.1` is available.

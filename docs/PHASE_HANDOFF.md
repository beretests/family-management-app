# Phase Handoff

## Current Phase

Phase 3: Database Schema and RLS

## Branch and Worktree

- Branch: `phase/03-db-rls`
- Worktree: `../family-app-phase-03-db-rls`
- Base branch: `main`

## Implemented Features

- Supabase local project config in `supabase/config.toml`.
- Initial schema migration in `supabase/migrations`.
- Core family, member, house, chore, task, schedule, swap, reward, points,
  reminder, audit, settings, and starter chore tables.
- RLS enabled on app tables.
- Security-definer helper functions for family membership and task access.
- Parent/child/caregiver policy boundaries for family-owned data.
- Starter chore seed data in `supabase/seed.sql`.
- SQL verification notes in `tests/sql`.
- Data model and product decision documentation.

## Manual Setup Still Required

- Install the Supabase CLI if it is not available locally.
- Run `supabase start` and `supabase db reset` to apply migrations locally.
- This repo uses non-default local Supabase ports to avoid conflicts with other
  local projects: API `55421`, database `55422`, Studio `55423`, email testing
  `55424`, SMTP `55425`, POP3 `55426`, analytics `55427`, and shadow database
  `55420`.
- Link and push to a remote Supabase project only after review:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

- Review RLS policies in the Supabase dashboard after applying migrations.
- No Vercel dashboard change is required for this phase.

## Known Issues and Limitations

- App UI is not wired to the new schema yet.
- Family/profile bootstrap server actions are Phase 4 scope.
- Storage buckets and storage policies are not implemented yet.
- Evidence cleanup and cron jobs are not implemented yet.
- RLS integration tests with authenticated JWTs are not automated yet.
- `SUPABASE_SECRET_KEY` should remain server-only. Do not use secret keys in
  browser code.

## Next Recommended Phase

Phase 4: Family and Child Profile Management

Expected branch and worktree:

- Branch: `phase/04-family-profiles`
- Worktree: `../family-app-phase-04-family-profiles`

## Checks

- `npm run lint` passed.
- `npm run typecheck` passed. The first sandboxed run could not write
  `tsconfig.tsbuildinfo` in the phase worktree; the escalated rerun passed.
- `npm test` passed: 3 files, 7 tests.
- `npm run build` passed. `next build` generated production route types, then
  `next-env.d.ts` was restored to avoid committing generated churn.
- `supabase start` passed after moving local Supabase ports away from defaults
  already used by another local project.
- `supabase db reset` passed and reapplied
  `20260708170000_initial_family_schema.sql` plus `supabase/seed.sql`.
- `psql postgresql://postgres:postgres@127.0.0.1:55422/postgres -v ON_ERROR_STOP=1 -f tests/sql/rls-verification.sql`
  passed:
  - app tables without RLS: 0
  - family-owned tables missing `family_id`: 0
  - starter chore templates seeded: 14

Environment note: local verification used Supabase CLI `2.84.2`; the CLI
reported that `2.109.1` is available.

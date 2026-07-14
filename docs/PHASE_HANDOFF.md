# Phase Handoff

## Current Phase

Phase 12: Deployment Polish

## Branch and Worktree

- Branch: `phase/12-deployment-polish`
- Worktree: `../family-app-phase-12-deployment-polish`
- Base branch: local `main` at `0b44e44` (`Merge branch 'phase/11-reminders-cleanup'`)

## Implemented Features

- Updated deployment documentation for Vercel and Supabase.
- Added `docs/deployment-checklist.md` with local, Supabase, Vercel, smoke-test,
  free-tier, and rollback steps.
- Updated `.env.example` to use current Supabase `SUPABASE_SECRET_KEY` guidance
  and stop advertising `SUPABASE_SERVICE_ROLE_KEY`.
- Updated server maintenance admin client to require `SUPABASE_SECRET_KEY`.
- Updated E2E local Supabase helper to prefer `SUPABASE_SECRET_KEY`, while still
  allowing local CLI admin-key parsing for local-only tests.
- Refreshed README, architecture, auth setup, local development, storage
  retention, Supabase setup, and Vercel setup docs for the completed MVP.
- Updated project guidance docs so future work does not recommend the legacy
  Supabase `service_role` key for production app deployment.

## Manual Setup Still Required

- Configure Supabase project URL, publishable key, and secret key.
- Apply Supabase migrations and seed data.
- Configure Supabase Auth Site URL and Redirect URLs.
- Configure Google OAuth if used.
- Configure Vercel environment variables.
- Configure `CRON_SECRET` in Vercel.
- Deploy to Vercel and run the deployment smoke checklist.
- No production deployment was performed by Codex.

## Known Issues and Limitations

- The local Supabase CLI still exposes a `SERVICE_ROLE_KEY` value for local test
  automation; production app deployment should use `SUPABASE_SECRET_KEY`.
- Browser notifications remain local browser alerts only; background push is not
  implemented.
- SMS, paid email, paid analytics, paid AI, queues, and external worker services
  remain intentionally out of scope.
- Vercel Hobby cron is low-frequency and not minute-precise.

## Next Recommended Phase

Post-MVP maintenance or owner-directed production deployment.

Suggested follow-up branches only after owner approval:

- `phase/13-production-smoke`
- `phase/13-kid-mode-pin`
- `phase/13-swap-requests`

## Checks

- `npm install` passed in the Phase 12 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- `npx prettier --write ...` formatted Phase 12 files. `.env.example` was not
  passed to Prettier because it has no inferred parser.
- `npx prettier --check ...` passed for supported Phase 12 files.
- `npm run lint` passed.
- `npm run typecheck` passed with worktree write permission for
  `tsconfig.tsbuildinfo`.
- `npm test` passed: 19 files, 63 tests.
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
- `npm run test:e2e` was not run for Phase 12 because this phase focused on
  deployment docs and readiness checks; the existing E2E flow remains available
  for local Supabase smoke testing.

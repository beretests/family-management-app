# Family Chore Hub

A private, mobile-first family management app for schedules, chores, rewards,
reminders, evidence review, and fair workload planning.

This repository is built iteratively with the workflow in `AGENTS.md`:

- one approved phase
- one branch
- one Git worktree
- one Codex session
- one review/merge gate back to `main`

## Current Status

The MVP implementation is complete through Phase 12 deployment polish. It
includes Supabase Auth, family and child profiles, schedule views, house-based
chore templates, fair assignments, kid task submissions with private evidence,
parent reviews and points, rewards, leaderboard, reminders, and daily evidence
cleanup.

No paid services are required by default.

## Tech Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- ESLint and Prettier
- Vitest and Playwright
- Vercel Hobby target
- Supabase Auth through `@supabase/ssr`
- Supabase Postgres migrations and RLS
- Supabase private Storage for evidence photos
- Vercel Cron for one daily maintenance route

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` when Supabase values are available.
The public landing page can run without Supabase values, but app routes need a
configured project.

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
SUPABASE_SECRET_KEY=
CRON_SECRET=
```

Use Supabase's current `sb_publishable_...` and `sb_secret_...` API keys. Do
not use the legacy `service_role` key for app deployment unless you are working
around local Supabase CLI tooling in tests.

Never commit real secrets.

## Checks

Run the standard checks before merging:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run E2E locally when Supabase is running and migrations are applied:

```bash
npm run test:e2e
```

## Deployment

Follow:

- `docs/deployment-checklist.md`
- `docs/supabase-setup.md`
- `docs/vercel-setup.md`
- `docs/auth-setup.md`
- `docs/storage-retention.md`

## Docs

- `docs/local-dev.md`: local setup and commands
- `docs/architecture.md`: current architecture and boundaries
- `docs/auth-setup.md`: Supabase Auth provider setup
- `docs/supabase-setup.md`: Supabase project setup
- `docs/vercel-setup.md`: Vercel deployment setup
- `docs/deployment-checklist.md`: end-to-end deployment checklist
- `docs/data-model.md`: database tables and RLS policy intent
- `docs/product-decisions.md`: product rules represented in the schema
- `docs/storage-retention.md`: evidence storage and cleanup
- `docs/PHASE_HANDOFF.md`: current handoff notes
- `docs/WORKTREE_PHASE_WORKFLOW.md`: branch/worktree process
- `docs/PRODUCT_SPEC.md`: product and UX requirements
- `docs/TECHNICAL_GUIDE.md`: technical, security, testing, and docs standards

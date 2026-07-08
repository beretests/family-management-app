# Family Chore Hub

A private, mobile-first family management app for schedules, chores, rewards,
and fair workload planning.

This repository is built iteratively with the workflow in `AGENTS.md`:

- one approved phase
- one branch
- one Git worktree
- one Codex session
- one review/merge gate back to `main`

## Current Phase

Phase 2 adds Supabase Auth for parent and caregiver accounts. It intentionally
does not add database migrations, RLS policies, storage buckets, cron jobs, or
paid services.

## Tech Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- ESLint
- Prettier
- Vitest
- Vercel Hobby target
- Supabase Auth through `@supabase/ssr`
- Supabase Postgres, RLS, and private storage planned for later phases

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Checks

Run the standard phase checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment

Copy `.env.example` to `.env.local` when local secrets are needed. The public
landing page can run without Supabase values. Auth routes show setup notices
until Supabase public env vars are configured.

Never commit real secrets.

## Docs

- `docs/local-dev.md`: local setup and commands
- `docs/architecture.md`: current architecture and phase boundaries
- `docs/auth-setup.md`: Supabase Auth provider setup
- `docs/supabase-setup.md`: Supabase dashboard setup notes
- `docs/vercel-setup.md`: Vercel env and callback setup notes
- `docs/PHASE_HANDOFF.md`: handoff notes for the next phase
- `docs/WORKTREE_PHASE_WORKFLOW.md`: branch/worktree process
- `docs/PRODUCT_SPEC.md`: product and UX requirements
- `docs/TECHNICAL_GUIDE.md`: technical, security, testing, and docs standards

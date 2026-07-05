# Phase Handoff

## Current Phase

Phase 1: Bootstrap App Foundation

## Branch and Worktree

- Branch: `phase/01-bootstrap-foundation`
- Worktree: `../family-app-phase-01-bootstrap-foundation`
- Base branch: `main`

## Implemented Features

- Next.js App Router foundation with TypeScript strict mode.
- Tailwind CSS styling through PostCSS.
- ESLint, Prettier, and Vitest configuration.
- Static mobile-first family dashboard preview.
- Shared `StatusPill` UI primitive.
- Typed bootstrap readiness helper with unit tests.
- `.env.example` with planned Supabase/Vercel variables.
- README, local development guide, and architecture guide.

## Manual Setup Still Required

- Run `npm install` after cloning or switching to the worktree.
- No Supabase dashboard setup is required yet.
- No Vercel dashboard setup is required yet.
- Do not add real secrets until later approved phases need them.

## Known Issues and Limitations

- Auth is not implemented.
- Database schema, migrations, RLS, and seed data are not implemented.
- Family, schedule, chore, assignment, submission, review, rewards, reminders,
  and storage features are static previews or future scope.
- The current app is a foundation, not an MVP.
- `npm audit --audit-level=moderate` reports two moderate findings from Next.js
  depending on a vulnerable transitive `postcss` version. `npm audit fix`
  suggests a breaking downgrade, so no automatic fix was applied in this phase.

## Next Recommended Phase

Phase 2: Supabase Auth

Expected branch and worktree:

- Branch: `phase/02-auth`
- Worktree: `../family-app-phase-02-auth`

## Checks

Completed in this worktree:

```bash
npm run lint       # passed
npm run typecheck  # passed
npm test           # passed, 1 file and 2 tests
npm run build      # passed
```

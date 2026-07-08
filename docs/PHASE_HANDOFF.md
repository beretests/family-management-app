# Phase Handoff

## Current Phase

Phase 2: Supabase Auth

## Branch and Worktree

- Branch: `phase/02-auth`
- Worktree: `../family-app-phase-02-auth`
- Base branch: `main`

## Implemented Features

- Supabase SSR client helpers for browser, server, and proxy contexts.
- `proxy.ts` session refresh using `@supabase/ssr` cookie handlers.
- Email/password sign-in and sign-up server actions.
- Google OAuth sign-in entry point.
- Auth callback route that exchanges codes for sessions.
- Protected `/dashboard` route with setup-aware missing-env fallback.
- Sign-out action from the protected app shell.
- Auth docs for Supabase and Vercel dashboard setup.
- Unit tests for redirect safety and email/password validation.

## Manual Setup Still Required

- Run `npm install` after cloning or switching to the worktree.
- Configure Supabase project auth settings before testing real auth flows.
- Add `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`.
- Configure Supabase redirect URLs for `/callback`.
- Configure Google OAuth in Supabase before testing Google sign-in.
- Vercel setup is documented but no deployment was performed.

## Known Issues and Limitations

- Database schema, migrations, RLS, and seed data are not implemented.
- Family, schedule, chore, assignment, submission, review, rewards, reminders,
  and storage features are placeholders or future scope.
- Protected route authorization only verifies Supabase auth claims. Family roles
  and RLS enforcement are Phase 3+ scope.
- Phone auth remains disabled by default because it requires an SMS provider and
  can incur cost.
- `npm audit --audit-level=moderate` reports two moderate findings from Next.js
  depending on a vulnerable transitive `postcss` version. `npm audit fix`
  suggests a breaking downgrade, so no automatic fix was applied in this phase.

## Next Recommended Phase

Phase 3: Database Schema and RLS

Expected branch and worktree:

- Branch: `phase/03-db-rls`
- Worktree: `../family-app-phase-03-db-rls`

## Checks

Completed in this worktree:

```bash
npm run lint       # passed
npm run typecheck  # passed
npm test           # passed, 3 files and 7 tests
npm run build      # passed
```

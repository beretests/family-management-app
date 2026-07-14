# Phase Handoff

## Current Phase

Phase 13: Secure Kid Access

## Branch and Worktree

- Branch: `phase/13-kid-mode-pin`
- Worktree: `../family-app-phase-13-kid-mode-pin`
- Base branch: `main` at `407e13a` (`fix: header layout`)

## Implemented Features

- Added parent-managed Kid Mode with hashed child PIN credentials.
- Added `family_member_pin_credentials` with parent-only RLS.
- Added signed HttpOnly child-session cookie utilities backed by
  `CHILD_SESSION_SECRET`.
- Added `/kid-mode` for parent unlock and child-mode exit.
- Added Family settings PIN setup/reset controls for active child profiles.
- Updated family context so a verified Kid Mode cookie makes the active app
  member the selected child while keeping the parent Supabase session.
- Updated child task checklist/submission actions to allow only the acting child
  and to use server-only admin writes for validated Kid Mode task writes.
- Added route-level parent gates for family settings, chore templates, and
  assignment generation.
- Documented Kid Mode setup, env vars, data model, and older child linked auth
  account support through `family_member_auth_links`.

## Manual Setup Still Required

- Apply Supabase migrations, including
  `20260714160000_kid_mode_pin_credentials.sql`.
- Set `CHILD_SESSION_SECRET` in local `.env.local` and Vercel.
- Keep `SUPABASE_SECRET_KEY` server-only; Kid Mode task writes require it after
  server-side validation.
- Redeploy after setting Vercel env vars.
- Parent must set a PIN for each child before that child can use Kid Mode.

## Known Issues and Limitations

- Kid Mode is household profile switching, not independent child authentication.
- A child with access to an unlocked parent browser still depends on app-level
  server checks; do not treat the PIN as a full account password.
- Older child Supabase Auth accounts are supported by the existing
  `family_member_auth_links` lookup path, but this phase does not add a full
  email invitation UI.
- Reward redemption and child schedule mutation under Kid Mode may need future
  server-action updates if those flows should write as the child through the
  parent session.

## Next Recommended Phase

Owner-directed hardening after merge:

- `phase/14-kid-mode-e2e`: browser smoke tests for PIN unlock, child task
  submission, parent-only redirects, and exit.
- `phase/14-child-auth-invites`: parent-managed invitation/linking UI for older
  kids with their own Supabase Auth accounts.

## Checks

- `npm install` passed in the Phase 13 worktree. npm reported 2 moderate
  vulnerabilities in existing dependencies.
- Initial `npm run lint` and `npm run typecheck` failed before local
  dependencies were installed in this sibling worktree.
- `npm run lint` passed after dependency install.
- `npm run typecheck` passed with worktree write permission for
  `tsconfig.tsbuildinfo`.
- `npm test` passed: 21 files, 69 tests.
- Initial `npm run build` failed because the sandbox could not create `.next` in
  the sibling worktree.
- `npm run build` passed with worktree write permission and included `/kid-mode`.

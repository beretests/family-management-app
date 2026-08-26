# Phase Handoff

## Current Phase

Phase 21: Password Recovery

## Branch and Worktree

- Branch: `phase/21-password-recovery`
- Worktree: `../family-app-phase-21-password-recovery`
- Base branch: `main` at `1a870cb` (`Merge branch
'phase/20-ics-calendar-import'`)

## Implemented Features

- Added a **Forgot password?** entry point to email sign-in.
- Added `/forgot-password` with email normalization, validation, disabled setup
  state, pending feedback, and an account-enumeration-resistant success message.
- Sent Supabase recovery email links through the existing SSR PKCE callback and
  continued verified sessions to `/reset-password`.
- Returned invalid or expired recovery callbacks to the reset request page with
  a clear retry path while preserving existing callback behavior for sign-up,
  OAuth, and invitations.
- Added `/reset-password` with server-verified session gating, matching password
  validation, pending/error feedback, Supabase password update, and sign-out
  before returning to sign-in.
- Kept password recovery available during the calendar-only rollout.
- Extracted the existing auth notice and submit controls for consistent,
  accessible auth forms.
- Documented local Mailpit testing, production SMTP constraints, redirects, and
  deployment smoke verification.

## Manual Setup Still Required

- Keep each environment's existing `/callback` URL in the Supabase Auth redirect
  allow-list; no additional recovery redirect entry is required.
- Verify that a customized Supabase recovery email template preserves the
  generated confirmation link and app-provided redirect.
- Configure and review an approved SMTP provider before relying on auth email in
  production. Supabase's built-in sender is testing-oriented, restricts
  recipients, and is currently limited to two project-wide auth emails per hour.
- Run the documented browser flow against local Mailpit or a reviewed remote
  Supabase project. The local API and Mailpit endpoints were not reachable in
  this session, so an email-delivery round trip was not completed.
- No database migration, RLS policy, Vercel dashboard change, environment
  variable, secret, paid service, or production deployment is required.

## Known Issues and Limitations

- Recovery depends on working Supabase Auth email delivery.
- PKCE recovery links are short-lived, single-use, and must be opened in the
  same browser that requested them.
- Google-only users can continue signing in with Google; password recovery is
  intended for Supabase email accounts.
- `npm install` under the shell's default Node 18/npm 9 omitted Tailwind's
  optional Linux binding. Checks used Node 24.3, matching Phase 20, and the
  exact lockfile-recorded binding was installed locally without changing the
  lockfile.
- The existing locked dependency tree still reports six high-severity npm audit
  findings. This phase did not run an automatic audit fix or change dependencies.

## Next Recommended Phase

- Review the Phase 21 forms and run the documented email round trip in a browser.
  Merge after owner approval.

## Checks

- Focused auth, redirect, rollout, callback, and component coverage passed: 5
  files, 35 tests.
- Repository-wide lint passed.
- TypeScript passed with Node 24.3.
- Full unit/component suite passed: 32 files, 143 tests.
- Production build passed with Next.js 16.2.10 and includes
  `/forgot-password` and `/reset-password` in route output.
- Phase 21 files pass Prettier formatting and `git diff --check`.
- Local Supabase email-delivery integration was not run because the local API
  and Mailpit endpoints were unavailable after the existing stack start check.

## Recommended Commit

`feat(auth): add password recovery flow`

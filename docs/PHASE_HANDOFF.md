# Phase Handoff

## Current Phase

Phase 28: Existing Child Account Linking

## Branch and Worktree

- Branch: `phase/28-existing-child-account-link`
- Worktree: `../family-app-phase-28-existing-child-account-link`
- Base branch: `main` at `b18bc5d`

## Implemented Features

- Extended Connect email so a parent can connect either a new address or a
  confirmed existing app account to an active child profile.
- Kept the parent response neutral: both successful delivery modes use the
  same message, and occupied/delivery failures do not confirm registration.
- Continued to use Supabase admin invitations for new addresses; those child
  accounts create a password during acceptance.
- Added passwordless magic-link delivery for existing accounts with
  `shouldCreateUser: false`, so an unknown address is never created by the
  existing-account fallback.
- Existing-account acceptance does not call the password-update API and
  preserves the account's current password and sign-in methods.
- Added mode-aware acceptance UI: new accounts see password fields, while
  existing accounts see a password-preservation explanation and no password
  inputs.
- Kept exact-email matching, invitation expiry/revocation behavior, child
  profile reuse, email scrubbing, and parent disconnect behavior.
- Added browser coverage for new accounts, existing accounts with password
  preservation, occupied-account rejection, and the broader family workflow.

## Database and Security Changes

- Added `20260828230000_existing_child_account_linking.sql`.
- Added `family_child_invitations.account_mode` with constrained values
  `new_account` and `existing_account`; parent RLS inserts can use only the
  safe `new_account` default.
- Added a server-only exact-email Auth lookup that reports confirmation and
  active-family-access state without exposing it to browser roles.
- Hardened atomic invitation acceptance to reject any Auth account with an
  active direct family membership or unrevoked member link, including another
  family.
- Explicitly revoked both lookup and acceptance RPC execution from `public`,
  `anon`, and `authenticated`, then granted execution only to `service_role`.
- Added SQL verification for function grants, unknown-email lookup, safe mode
  defaults, existing-account acceptance, exact-email matching, expired/revoked
  links, and occupied-account rejection.

## Manual Setup Still Required

- Apply `20260828230000_existing_child_account_linking.sql` to the target
  Supabase project after reviewing the migration.
- In Supabase Auth email templates, ensure the Magic Link template retains
  `{{ .ConfirmationURL }}`.
- Keep each production `/callback` URL in the Supabase redirect allow-list.
- Configure and review a production SMTP provider before relying on delivery
  to arbitrary child email addresses; Supabase's built-in sender is intended
  for testing and is tightly rate-limited.
- No new Vercel setting or environment variable is required.
- Production deployment was not performed.

## Known Issues and Limitations

- The MVP allows one active family context per Auth account. It rejects rather
  than merges an account that already has active family access.
- An account created only through some OAuth configurations may not accept a
  passwordless email link. A separate OAuth account-claim flow is outside this
  phase.
- Supabase Auth invite and magic-link cooldown/rate limits still apply.
- The repository requires Node 20.9 or newer; verification used Node 22.14.0
  because the host shell defaults to unsupported Node 18.
- The locked dependency tree still reports six high-severity npm audit
  findings. No dependency versions or automatic audit fixes were introduced.

## Next Recommended Phase

- Review Phase 28, apply the migration in a non-production Supabase project,
  and manually verify both email templates before approving merge.
- After merge, verify the production SMTP and redirect configuration in a
  preview deployment before production rollout.

## Checks

- TypeScript checking passed under Node 22.14.0.
- Repository-wide lint passed under Node 22.14.0.
- Full unit/component suite passed: 42 files, 185 tests.
- The Playwright parent/family suite passed: 4 tests, including new-account
  invitation, existing-account linking with the old password still valid,
  occupied-account rejection, and the full family/calendar/grocery workflow.
- Phase 28 SQL verification passed against local Supabase.
- Phase 26 child invitation/disconnection SQL regression verification passed.
- Local Supabase database lint passed with no schema errors.
- Production build passed with Next.js 16.2.10.
- `git diff --check` passed.

## Recommended Commit

`feat(auth): link existing accounts to child profiles`

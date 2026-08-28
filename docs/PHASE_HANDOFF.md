# Phase Handoff

## Current Phase

Phase 26: Family Profiles and Child Email Accounts

## Branch and Worktree

- Branch: `phase/26-family-child-email`
- Worktree: `../family-app-phase-26-family-child-email`
- Base branch: `main` at `bfe5b34`

## Implemented Features

- Added parent-only Family navigation to the default Calendar/Groceries
  rollout; child and caregiver accounts do not see this control.
- Updated limited-mode Family settings to return to Calendar instead of a
  gated Dashboard route.
- Added parent-managed child email invitations that always target an existing
  active child profile.
- Added 14-day invitation expiry, exact normalized-email matching, pending
  invite uniqueness, and terminal-state email scrubbing.
- Added a child acceptance page that creates the child's password, connects
  the authenticated profile atomically, and redirects to Calendar.
- Added visible per-child account states and parent controls to send/revoke an
  invite or disconnect an accepted email account.
- Preserved Kid Mode/PIN access alongside child email accounts.
- Disconnect and child deactivation revoke active auth links while preserving
  the child profile, Auth user, Kid Mode credential, and historical records.
- Added audit events for invitation, revocation, acceptance, and disconnect;
  corrected legacy family action inserts to use the schema's `event_type`
  column and report failures.
- Added RLS, component, schema, and navigation regression coverage.

## Manual Setup Still Required

- Apply migrations:
  - `20260828210000_child_email_invitations.sql`
  - `20260828211000_fix_child_disconnect_actor.sql`
- Keep `SUPABASE_SECRET_KEY` server-only. No new environment variable is
  required.
- Confirm each production origin's `/callback` remains in Supabase Auth's
  redirect allow-list.
- Supabase's built-in SMTP is suitable only for testing and restricted
  recipients. Configure and review a production SMTP provider before relying
  on delivery to arbitrary child email addresses. No provider or paid service
  was configured in this phase.
- Production deployment was not performed.

## Known Issues and Limitations

- Automatic child invitations currently require an email that has not already
  registered in this app; Supabase's admin invitation API rejects confirmed
  existing users. Linking an existing account is deferred.
- The invitation email is a one-account connection workflow, not a parental
  consent or age-verification service. The parent must confirm authority before
  sending it.
- Disconnecting removes family access but intentionally does not delete the
  Supabase Auth user. The former child account can still exist without family
  membership.
- The locked dependency tree still reports six high-severity npm audit
  findings. No dependency versions or automatic audit fixes were introduced.

## Next Recommended Phase

- Review one real hosted child invitation end-to-end after SMTP and callback
  settings are configured.
- Plan existing-account linking or guardian/age-policy requirements as a
  separate auth phase if needed; do not broaden Phase 26's RLS or use a paid
  identity service without approval.

## Checks

- Repository-wide lint passed.
- TypeScript checking passed.
- Full unit/component suite passed: 40 files, 179 tests.
- Both Phase 26 migrations applied successfully to local Supabase.
- Supabase local database lint reported no schema errors.
- Rollback-only SQL verification passed for parent-only invitation access,
  exact-profile acceptance, no duplicate child creation, linked-child RLS
  access, email scrubbing, and disconnect preservation.
- The complete Playwright suite passed: the new email flow sends through local
  Mailpit, accepts and passwords the linked child, verifies child navigation,
  reconnects the parent, and disconnects without removing the child; the
  established calendar/grocery/chore family journey also passed. Two tests ran
  in 1.2 minutes.
- Production build passed with Next.js 16.2.10 and includes
  `/family/child-invite/accept` and `/invite-callback`.
- `git diff --check` passes.

## Recommended Commit

`feat(family): add child email invites and planner family access`

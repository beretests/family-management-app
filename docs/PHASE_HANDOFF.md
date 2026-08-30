# Phase Handoff

## Current Phase

Phase 30: Copyable Child Invitation Links

## Branch and Worktree

- Branch: `phase/30-copy-child-invite-links`
- Worktree: `../family-app-phase-30-copy-child-invite-links`
- Base branch: `main` at `0e3c347`

## Implemented Changes

- Added **Generate secure link** beside the existing child connection-email
  action.
- Added **Generate fresh link** for pending child invitations so parents can
  recover when an Auth email is delayed or not delivered.
- Added a responsive secure-link modal with a read-only selectable URL, an
  explicit Clipboard API action, and a manual-select fallback.
- Preserved the existing email-delivery route as the default behavior.
- Added schema, component, and browser coverage for both delivery methods.
- Documented the copied-link workflow, account behavior, setup, and security
  expectations in the auth, Supabase, architecture, and roadmap docs.

## Account and Security Behavior

- Link generation runs only in parent-authorized Server Actions and uses the
  server-only Supabase admin client.
- Confirmed existing accounts receive a `magiclink`, retain their current
  password, and are never duplicated.
- Missing or unconfirmed accounts receive an `invite` and create a password
  during acceptance.
- Fresh-link generation rechecks current Auth confirmation and active-family
  status before issuing a link.
- Exact invited-email matching, pending-invitation expiry, atomic acceptance,
  and one-family account restrictions remain enforced.
- Raw generated URLs are returned only to the authorized action response. They
  are not written to invitation rows, audit metadata, or application logs.
- Audit events record the invitation/member IDs, account mode, and generation
  source without storing the email address or bearer credential.

## Database and Platform Changes

- No migration, RLS policy, database function, Storage bucket, dependency, or
  auth/session architecture changed.
- No new Supabase or Vercel dashboard setting is required.
- No environment variable is new or changed. The feature reuses
  `NEXT_PUBLIC_APP_URL`, the existing public Supabase settings, and the
  server-only `SUPABASE_SECRET_KEY`.
- The existing local and production `/callback` redirect allow-list entries
  cover generated links.
- No paid provider or service was added. Direct link generation avoids SMTP
  delivery limits but requires the parent to share the bearer link privately.

## Manual Setup Still Required

- Ensure the production `NEXT_PUBLIC_APP_URL` matches the deployed app origin.
- Keep the production `/callback` URLs allow-listed in Supabase Auth.
- Keep `SUPABASE_SECRET_KEY` server-only in Vercel and never expose it through a
  public environment variable.
- Test one generated link in a Vercel preview deployment before production
  rollout. Production deployment was not performed.

## Known Issues and Limitations

- Anyone who obtains an unused generated URL may be able to authenticate as the
  invited account. Parents must use a trusted sharing channel and revoke the
  pending invitation if exposure is suspected.
- Direct link generation does not deliver a message or notify the child; it
  only gives the parent a link to copy.
- The copied URL is intentionally not recoverable after the modal closes. A
  parent can generate a fresh link while the invitation remains pending.
- Existing OAuth-only accounts may still depend on the Supabase project's
  identity configuration for passwordless email-link acceptance.
- Verification used Node 22.14.0 because the host shell defaults to unsupported
  Node 18.
- The full Playwright suite emitted the previously documented Next.js
  development-only `The destination stream closed early` message during a
  client-aborted RSC navigation; all four browser tests passed.

## Checks

- Clean dependency installation completed under Node 22.14.0 with zero npm
  vulnerabilities.
- TypeScript checking passed.
- Repository-wide lint passed.
- Full unit/component suite passed: 43 files, 187 tests.
- The focused unconfirmed-account copied invite-link flow passed.
- The full Playwright parent/family suite passed: 4 tests covering new,
  confirmed-existing, and occupied accounts plus the existing family,
  calendar, chores, assignments, and grocery workflow.
- Production build passed with Next.js 16.3.3.
- `git diff --check` passed.

## Next Recommended Action

- Review and commit Phase 30, then merge it after owner approval.
- Validate a generated link in a Vercel preview using the production Supabase
  project before production rollout.

## Recommended Commit

`feat(family): add copyable child invitation links`

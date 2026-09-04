# Phase Handoff

## Current Phase

Phase 34: Supabase Grant Repair

## Branch and Worktree

- Branch: `phase/34-supabase-grant-repair`
- Worktree: `../family-app-phase-34-supabase-grant-repair`
- Base branch: `main` at `8731d59`

## Implemented Changes

- Added a forward-only migration that explicitly grants authenticated users the
  operations used on PIN credentials, adult invitations, schedule attendees,
  recurrences, and occurrence overrides created after the initial schema.
- Kept all six repaired private tables inaccessible to `anon`; their existing
  parent- and family-scoped RLS policies remain unchanged.
- Added operation-specific `service_role` grants for reviewed server-only adult
  and child invitation, Kid Mode write, schedule recurrence, reminder, evidence
  cleanup, and grocery retention workflows.
- Added the missing `service_role` execution grant for the existing Kid Mode
  task-submission function.
- Added SQL regression checks for required authenticated and server privileges,
  unexpected authenticated privileges, anonymous denial, and function access.
- Updated the obsolete local Supabase `[local_smtp]` configuration section to
  the current `[inbucket]` name.
- Corrected two stale Calendar smoke-test expectations exposed after the
  database blocker was removed: duration copy and the Phase 33 mobile member
  dropdown.

## Database and Platform Changes

- New migration:
  `20260904190000_repair_authenticated_table_grants.sql`.
- No table, column, constraint, index, RLS policy, Storage policy, Auth setting,
  dependency, environment variable, or Vercel configuration changed.
- No paid service or additional free-tier usage was introduced.

## Manual Setup Still Required

- Apply the Phase 34 migration to each hosted Supabase environment before
  deploying or rerunning its browser automation.
- Optionally run `tests/sql/table-grants-verification.sql` against each migrated
  environment to confirm its object-privilege boundary.
- No Vercel dashboard or environment-variable change is required.

## Known Issues and Limitations

- The migration was applied and verified only against the local Supabase test
  database; no hosted database was changed.
- `npm ci` reports one existing high-severity transitive dependency finding.
  Dependencies remain unchanged because upgrades are outside this phase.
- The host defaults to unsupported Node 18. JavaScript checks pass with the
  available Node 24.3.0 runtime.

## Checks

- Reviewed current official Supabase guidance for explicit table grants, RLS,
  Data API `42501` failures, and current local CLI configuration.
- Supabase CLI 2.84.2 parses `config.toml`; local stack status succeeded.
- Confirmed only the Phase 34 migration was pending, then applied it locally
  without resetting or deleting local data.
- Grant verification passed: all five result sets returned zero rows.
- Existing child-email invitation SQL verification passed.
- Supabase database lint passed with no schema errors.
- Focused family/Groceries/Calendar Playwright flow passed.
- Complete Playwright suite passed: 4 tests.
- Repository-wide ESLint passed.
- TypeScript checking passed.
- Full unit/component suite passed: 48 files, 202 tests.
- Production build passed with Next.js 16.3.3.

## Next Recommended Action

- Review and commit Phase 34, apply its migration to the browser-test Supabase
  environment, rerun automation there, then merge after owner approval.

## Recommended Commit

`fix(db): grant RLS-protected app workflows`

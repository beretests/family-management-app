# Phase Handoff

## Current Phase

Phase 27: Mobile Menu and Family Action Modals

## Branch and Worktree

- Branch: `phase/27-mobile-menu-family-modals`
- Worktree: `../family-app-phase-27-mobile-menu-family-modals`
- Base branch: `main` at `f84a994`

## Implemented Features

- Added a mobile-only Menu control while keeping the Family Planner/Family
  Chore Hub identity visible.
- Collapsed primary routes, Sign out, and Exit Kid Mode into the mobile menu;
  desktop navigation retains its full layout.
- Added stacked, full-width mobile navigation controls with 44-pixel minimum
  touch targets.
- Added Escape-to-close behavior, restored focus to the Menu button, and
  closed the menu when a route is selected.
- Added a compact Family actions panel near the top of Family settings.
- Moved Add child and Invite parent/caregiver forms into accessible modals.
- Moved parent and child profile editors into accessible modals.
- Moved Connect child email into an accessible modal.
- Kept validation errors inside their active modal; successful actions close
  the modal and announce the result in the surrounding page.
- Left Kid PIN, status, invitation revocation, account disconnection, and
  deactivation controls unchanged.
- Added component and browser regression coverage for the responsive menu and
  family modal workflows.

## Database and Security Changes

- No database migrations were added.
- No RLS policies, permissions, authentication behavior, or session
  architecture changed.

## Manual Setup Still Required

- No new Supabase or Vercel dashboard setup is required.
- No new environment variables are required.
- Production deployment was not performed.

## Known Issues and Limitations

- Connecting a child email still requires an address that has not already
  registered in the app. Linking an existing authenticated account remains
  the separately planned Phase 28 auth/security change.
- Kid PIN and status forms intentionally remain inline in this phase.
- The repository requires Node 20.9 or newer; verification used Node 22.14.0
  because the host shell defaults to unsupported Node 18.
- The locked dependency tree still reports six high-severity npm audit
  findings. No dependency versions or automatic audit fixes were introduced.

## Next Recommended Phase

- Review Phase 27 at mobile and desktop widths and merge it after approval.
- After Phase 27 is merged, implement the separately planned existing-account
  child linking flow as Phase 28, including its migration, auth verification,
  and RLS/security tests.

## Checks

- TypeScript checking passed under Node 22.14.0.
- Repository-wide lint passed under Node 22.14.0.
- Full unit/component suite passed: 41 files, 182 tests.
- The Playwright family suite passed: the mobile workflow verified the
  collapsed menu, Escape/focus behavior, and modal child creation; the child
  email workflow verified modal invitation, acceptance, reconnection, and
  disconnection. Two tests passed.
- Production build passed with Next.js 16.2.10.
- `git diff --check` passed.

## Recommended Commit

`feat(ui): add mobile menu and family action modals`

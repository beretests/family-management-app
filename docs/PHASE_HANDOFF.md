# Phase Handoff

## Current Phase

Phase 17: Loading Feedback and Auto-Clearing Notices

## Branch and Worktree

- Branch: `phase/17-loading-feedback`
- Worktree: `../family-app-phase-17-loading-feedback`
- Base branch: `main` at `f989d99` (`Merge branch 'phase/16-adult-family-invites'`)

## Implemented Features

- Added route-level loading screens for authenticated app routes and auth
  routes.
- Added a reusable loading panel with lightweight skeleton rows.
- Added inline navigation pending indicators inside the authenticated app shell.
- Updated shared submit buttons to show a spinner, disable while pending, and
  use action-specific pending labels.
- Updated auth email and Google submit buttons with pending states.
- Updated shared action messages and auth notices to auto-clear.
- Success notices clear after 4.5 seconds.
- Error/warning notices clear after 10 seconds.

## Manual Setup Still Required

- None.

## Known Issues and Limitations

- Very fast prefetched navigation may complete before the inline pending dot is
  visible; route-level loading still covers slower transitions.
- Auto-clear timing is fixed in code and not yet user-configurable.
- This phase does not add toast stacking or a notification center.

## Next Recommended Phase

- Guided onboarding for new families: family setup, child profiles, starter
  chores, schedule basics, and first adult invite.

## Checks

- `npm install` passed. npm reported 2 moderate vulnerabilities in existing
  dependencies.
- Initial `npm run lint`, `npm run typecheck`, and `npm test` failed before
  install because this sibling worktree did not have local dependencies.
- Initial `npm run lint` after install failed on synchronous state updates in
  effects; the auto-clear implementation was adjusted to schedule dismissals
  without synchronous effect state resets.
- `npm run lint` passed.
- Initial `npm run typecheck` failed because the sandbox could not write
  `tsconfig.tsbuildinfo` in the sibling worktree.
- `npm run typecheck` passed with worktree write permission.
- `npm test` passed: 23 files, 77 tests.
- `npm run build` passed with worktree write permission.

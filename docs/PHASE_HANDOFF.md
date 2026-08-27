# Phase Handoff

## Current Phase

Phase 22 Amendment: Calendar Modal Details and Mobile Responsiveness

## Branch and Worktree

- Branch: `phase/22-calendar-modal-mobile`
- Worktree: `../family-app-phase-22-calendar-modal-mobile`
- Base branch: `main` at `b61562b` (Phase 22 merged)

## Implemented Features

- Removed the duplicate inline Day and Week event-details sections. Full event
  details now appear only after a timed or all-day calendar event is selected.
- Added an accessible native dialog with a labelled heading, initial focus,
  Escape/backdrop/close-button handling, background scroll locking, and focus
  restoration to the selected event.
- Kept authorized edit/delete controls inside the modal, including recurring
  scopes for **This event**, **This and following events**, and **Entire
  series**.
- Made Day view fit narrow screens without page-level horizontal scrolling and
  reduced the Week canvas width while retaining contained horizontal scrolling
  for its seven columns.
- Improved narrow-screen padding, text wrapping, form sizing, date controls,
  file input sizing, navigation containment, and touch-target sizing across the
  shared app shell, schedule, auth, and initial family setup surfaces.
- Expanded the parent browser flow to run at 390 x 844 and verify viewport
  containment across sign-in, family setup/settings, calendar Day and Week,
  chores, assignments, and My Today.

## Manual Setup Still Required

- This amendment adds no migration, RLS policy, Supabase dashboard setting,
  Vercel dashboard change, environment variable, secret, paid service, Storage
  bucket, or deployment step.
- If the underlying Phase 22 migration has not yet reached an environment,
  apply `20260826170000_schedule_occurrence_overrides.sql` through the normal
  reviewed migration workflow before using recurring edit scopes there.

## Known Issues and Limitations

- Week view intentionally scrolls horizontally inside the calendar on narrow
  screens so all seven days retain usable event widths.
- Imported ICS `EXDATE`, `RDATE`, `EXRULE`, and `RECURRENCE-ID` exceptions remain
  unsupported; app-created occurrence overrides remain supported.
- The existing locked dependency tree still reports six high-severity npm audit
  findings. This amendment did not change dependency versions or run an
  automatic audit fix.

## Next Recommended Phase

- Review the modal interaction and responsive layouts in a browser, then merge
  after owner approval.
- A later accessibility polish phase may add automated screen-reader and
  reduced-motion checks across the remaining feature surfaces.

## Checks

- Repository-wide lint passed.
- TypeScript checking passed.
- Full unit/component suite passed: 34 files, 153 tests.
- The local Playwright parent flow passed at a 390 x 844 viewport, including
  modal-only event details and page-overflow checks on the main app surfaces.
- Production build passed with Next.js 16.2.10 and includes `/schedule` in the
  dynamic route output.
- No SQL verification was rerun because this amendment has no database or RLS
  changes; the merged Phase 22 migration and SQL checks remain unchanged.
- Changed TypeScript, CSS, and Markdown files pass Prettier, and
  `git diff --check` passes.

## Recommended Commit

`fix(schedule): show event details in a responsive modal`

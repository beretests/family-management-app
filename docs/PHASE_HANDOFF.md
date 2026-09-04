# Phase Handoff

## Current Phase

Phase 33: Calendar Interaction Polish

## Branch and Worktree

- Branch: `phase/33-calendar-interaction-polish`
- Worktree: `../family-app-phase-33-calendar-interaction-polish`
- Base branch: `main` at `520758c`

## Implemented Changes

- Excluded every all-day schedule event from calendar conflict badges while
  preserving conflict detection for overlapping timed events assigned to the
  same member.
- Excluded every all-day schedule event from chore-assignment conflict warnings
  and scoring penalties.
- Added full event-title hover text to desktop timed cards, desktop all-day
  cards, and mobile agenda cards without introducing browser dialogs.
- Moved Previous, Today, and Next into a dedicated navigation bar directly
  above the day/week calendar.
- Kept Day/Week and Jump-to-date controls in the schedule header.
- Replaced the mobile stack of family-member links with a GET-backed select and
  Apply button while retaining horizontally scrollable member pills on desktop.
- Preserved the selected civil date, view, timezone, and member across all
  schedule navigation controls.

## Database and Platform Changes

- No migration, RLS policy, grant, Storage, Auth, dependency, environment
  variable, Supabase dashboard, or Vercel dashboard change.
- No paid service or additional free-tier usage was introduced.

## Manual Setup Still Required

- None. Deploy the application normally after this phase is merged.

## Known Issues and Limitations

- The focused Playwright flow remains blocked immediately after family setup by
  the pre-existing `permission denied for table family_member_pin_credentials`
  error, before it reaches Calendar.
- The older `schedule_event_members` authenticated table-privilege gap remains
  outside this UI-only phase.
- `npm ci` reports one existing high-severity transitive dependency finding.
  Dependencies were not changed because upgrades are outside this phase.
- The host defaults to unsupported Node 18. JavaScript checks used the available
  Node 24.3.0 runtime.

## Checks

- Reviewed repository-local Next.js 16.3.3 guidance for forms, Server and
  Client Components, and accessibility.
- Focused conflict, assignment, event-card, and navigation tests passed: 4
  files, 18 tests.
- Full unit/component suite passed: 48 files, 202 tests.
- Repository-wide ESLint passed.
- TypeScript checking passed.
- Production build passed with Next.js 16.3.3.
- Changed-file Prettier checks and `git diff --check` passed.
- Focused Playwright verification attempted and failed at the pre-existing
  `family_member_pin_credentials` grant blocker described above.

## Next Recommended Action

- Review and commit Phase 33, then merge it after owner approval.
- Plan a security-reviewed phase to reconcile authenticated table grants with
  existing RLS policies, then rerun the full browser suite.

## Recommended Commit

`fix(schedule): polish calendar conflicts and navigation`

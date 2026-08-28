# Phase Handoff

## Current Phase

Phase 25: Calendar Mobile Control Stacking

## Branch and Worktree

- Branch: `phase/25-calendar-mobile-controls`
- Worktree: `../family-app-phase-25-calendar-mobile-controls`
- Base branch: `main` at `ff281ac`

## Implemented Features

- Changed Add event and Import calendar to full-width vertically stacked
  buttons below the Tailwind `sm` breakpoint.
- Kept the two calendar action buttons on one non-wrapping horizontal row from
  `sm` upward, including at the 1024-pixel desktop breakpoint.
- Changed Whole family and every active family-member calendar filter to
  full-width vertically stacked rows on phones.
- Made mobile filter rows left-aligned with 44-pixel minimum touch targets.
  Member names wrap naturally by words instead of being squeezed into narrow
  vertical-letter pills.
- Preserved the compact rounded horizontal member filters from `sm` upward,
  including horizontal scrolling if a larger family exceeds the available
  desktop width.
- Added component and real-browser regression coverage for the responsive
  action and member-filter layouts.

## Manual Setup Still Required

- Phase 25 requires no database migration, RLS policy, Supabase dashboard
  setting, Storage change, Vercel dashboard change, environment variable,
  secret, paid service, or production setup.
- Production deployment was not performed.
- Any previously outstanding setup from earlier merged phases remains
  documented in the repository setup guides.

## Known Issues and Limitations

- Stacking every family member deliberately increases vertical space on phones
  in exchange for readable names and reliable touch targets.
- The layout returns to horizontal at 640 pixels. Large families may
  horizontally scroll the member-filter row at tablet and desktop widths.
- The existing locked dependency tree still reports six high-severity npm
  audit findings. Phase 25 did not change dependencies or run an automatic
  audit fix.

## Next Recommended Phase

- Review the Calendar page on the target phone and one tablet/desktop size,
  then merge Phase 25 after owner approval.
- Treat any broader calendar header redesign as a separately planned phase;
  this phase intentionally changes only the two requested control groups.

## Checks

- Repository-wide lint passed.
- TypeScript checking passed with incremental output disabled.
- Full unit/component suite passed: 39 files, 172 tests.
- The Playwright family journey passed in 1.1 minutes. At 390 x 844 it verifies
  that calendar action buttons and member filters are vertically stacked,
  equal-width rows with no page overflow. At 1024 x 900 it verifies both groups
  return to horizontal alignment before continuing through the existing
  calendar, grocery, chore, assignment, and My Today flow.
- The first responsive browser run identified that the action buttons could
  still wrap at exactly 1024 pixels. The action row was changed to non-wrapping
  with non-breaking labels, and the complete rerun passed.
- Production build passed with Next.js 16.2.10 and includes `/schedule` in
  the dynamic route output.
- Changed TypeScript and Markdown files pass Prettier.
- `git diff --check` passes.

## Recommended Commit

`fix(schedule): stack calendar controls on mobile`

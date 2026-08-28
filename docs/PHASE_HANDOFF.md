# Phase Handoff

## Current Phase

Phase 23: Calendar Actions, Mobile Agenda, and No School Events

## Branch and Worktree

- Branch: `phase/23-calendar-actions-mobile`
- Worktree: `../family-app-phase-23-calendar-actions-mobile`
- Base branch: `main` at `633272d`

## Implemented Features

- Replaced the bottom Add schedule item and Import calendar expanders with
  prominent **Add event** and **Import calendar** buttons beside the top
  calendar controls.
- Added a reusable accessible native dialog and moved both action forms into
  modals with Escape, backdrop, close-button, focus-restoration, and background
  scroll-lock behavior. Successful actions close the modal and announce status
  beside the toolbar.
- Replaced the narrow-screen time canvas with a date-grouped mobile agenda for
  Day and Week views. All seven Week dates remain visible vertically without
  horizontal calendar or page scrolling; the visual time grid remains on
  desktop.
- Added the `No School` schedule type to manual entry, recurring edits, and ICS
  import assignment. It is always all day in the UI, Server Actions, validation,
  and database constraints.
- Normalized all-day form and imported No School ranges to exclusive local
  midnight boundaries so saved dates remain correct in the selected browser
  time zone, including daylight-saving transitions.
- Made No School informational: it is excluded from event-conflict detection
  and chore-assignment availability checks.
- Added a labelled all-day event control plus a translucent full-column desktop
  treatment that spans every visible working-hour row.
- Expanded unit, component, browser, and SQL coverage for the toolbar modals,
  mobile agenda, No School invariants, all-day date conversion, all-day visual
  coverage, and non-blocking availability behavior.

## Manual Setup Still Required

- Apply `20260828170000_add_no_school_event_type.sql` through the normal reviewed
  Supabase migration workflow before exposing this version in an environment.
- No Supabase dashboard setting, RLS change, Storage bucket, Vercel dashboard
  change, new environment variable, secret, paid service, or deployment step is
  required.
- Production deployment and migration execution were not performed.

## Known Issues and Limitations

- The phone experience deliberately uses an agenda instead of preserving the
  desktop hour-by-hour geometry. Desktop retains the time grid and full-height
  all-day treatment.
- Imported ICS `EXDATE`, `RDATE`, `EXRULE`, and `RECURRENCE-ID` exceptions remain
  unsupported; app-created occurrence overrides remain supported.
- All-day No School entries are informational by product decision. Families
  that later want them to block chores will need a separate availability rule,
  not a presentation change.
- The existing locked dependency tree still reports six high-severity npm audit
  findings. Phase 23 did not change dependency versions or run an automatic
  audit fix.

## Next Recommended Phase

- Review Phase 23 on a phone and desktop, then merge after owner approval.
- Plan the grocery shopping list as a separate Phase 24, including list
  ownership, item catalog deduplication, quantities/units, item lifecycle,
  concurrent household editing, RLS permissions, history, and retention.

## Checks

- Repository-wide lint passed.
- TypeScript checking passed with incremental output disabled.
- Full unit/component suite passed: 36 files, 161 tests.
- The local Playwright parent flow passed at 390 x 844 and 1024 pixel widths,
  including top action modals, No School creation, mobile Week agenda,
  full-column all-day coverage, and ICS import.
- All five local SQL verification scripts passed, including No School enum and
  all-day constraint checks; the existing RLS and family-table checks returned
  zero rows and the starter chore count remained 14.
- Production build passed with Next.js 16.2.10 and includes `/schedule` in the
  dynamic route output.
- Phase TypeScript and Markdown files pass Prettier. SQL files are not handled
  by the configured Prettier parser.
- `git diff --check` passes.

## Recommended Commit

`feat(schedule): add responsive calendar actions and no-school events`

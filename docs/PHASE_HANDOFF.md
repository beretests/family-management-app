# Phase Handoff

## Current Phase

Phase 18: Schedule Time Grids and Calendar-Only Rollout

## Branch and Worktree

- Branch: `phase/18-schedule-time-grid`
- Worktree: `../family-app-phase-18-schedule-time-grid`
- Base branch: `main` at `c9dfb4f` (`update smtp congig for supabase`)

## Implemented Features

- Replaced the week card columns with a seven-day calendar whose vertical axis
  represents time.
- Added a matching single-day time grid while retaining the detailed event and
  parent edit controls below it.
- Positioned timed events from their actual start time and duration.
- Added two-hour time bands, lightly shaded weekends, and compact tinted event
  cards with title, time, location or notes, attendee/type context, and visible
  conflict labels.
- Added a separate all-day row and clipping for events that cross day or visible
  range boundaries.
- Split overlapping events into side-by-side columns and reuse columns when an
  overlap ends.
- Kept a family colour key with attendee names and sick/rest status text so the
  schedule does not depend on colour alone.
- Made the week grid horizontally scrollable on narrow screens instead of
  compressing seven days into unreadable columns.
- Added unit and rendered-component coverage for hour ranges, positioning,
  duration, overnight clipping, overlaps, timed cards, and all-day cards.
- Added a Whole family calendar view and one filtered view for every active
  family member. Individual views include that member's events plus events that
  apply to the whole family.
- Added calendar-owner headings, date context, event-count/duration summaries,
  and member controls while preserving day/week navigation and parent event
  creation/editing.
- Made Week the default when Calendar is the only product surface while keeping
  the existing Day default when the full app flag is enabled.
- Added the server-side `ENABLE_FULL_APP` rollout flag, disabled by default.
  Calendar-only mode limits signed-in navigation to Calendar and redirects
  Dashboard, My Today, Chores, Assignments, Approvals, Rewards, Leaderboard,
  Reminders, and Kid Mode routes to `/schedule`.
- Kept authentication, callback/invitation flows, initial family/member setup,
  APIs, and cron routes available as Calendar support infrastructure.
- Added calendar-focused public landing content when the full app flag is off.
  `ENABLE_FULL_APP=true` restores the existing full navigation and routes.

## Manual Setup Still Required

- Add `ENABLE_FULL_APP=false` to local and Vercel environments for an explicit
  calendar-only rollout, or leave it unset because false is the safe default.
- Set `ENABLE_FULL_APP=true` and redeploy to restore the complete app surface.
- No new Supabase migration, policy, dashboard change, dependency, or paid
  service is required for Phase 18.
- Any incomplete Phase 16 invitation/auth setup remains required as documented
  in the repository setup guides.

## Known Issues and Limitations

- The standard visible range is 6 AM to 10 PM and expands when earlier or later
  events exist; a very long or overnight event can therefore make the grid
  taller.
- Week-view cards remain glance-only. Detailed notes and parent edit controls
  are available in day view, matching the existing edit workflow.
- Mobile week view uses horizontal scrolling; it does not collapse into an
  agenda list.
- Drag-and-drop editing, a current-time indicator, and month view are outside
  this phase.
- Family settings are hidden from calendar-only navigation but remain directly
  reachable because new parents need them to add and maintain calendar members.
- The flag is deployment-wide, not configurable per family or per user.
- Phase 17 loading-feedback work remains in its separate unmerged worktree and
  was not modified. Its two-line `app-shell.tsx` loading-indicator change must
  be preserved when the branches are integrated.
- `npm ci` reported four high-severity advisories in the existing locked
  dependency tree. This phase added no dependency and did not run an automatic
  audit fix.

## Next Recommended Phase

- Complete and merge the existing Phase 17 loading-feedback work, then add
  guided onboarding for family setup, children, starter chores, schedule basics,
  and the first adult invite.

## Checks

- Reviewed current official Next.js App Router CSS/Server Component guidance and
  Tailwind responsive overflow guidance, plus current Next.js Proxy and
  environment-variable guidance, before implementation.
- The shell initially selected Node 18, below the documented Node 20.9 minimum;
  all authoritative checks were rerun with the installed Node 24.3 runtime.
- Lint passed.
- TypeScript passed. The sibling worktree required permission to write
  `tsconfig.tsbuildinfo`.
- Focused calendar/flag/filter tests passed: 5 files, 38 tests.
- Full unit/component suite passed: 28 files, 115 tests.
- Production build passed with Next.js 16.2.10 and retained every existing app
  route in the build output.
- Production-server checks in calendar-only mode confirmed `/dashboard` and
  `/chores` return `307` to `/schedule`, `/schedule` remains reachable, and the
  public page renders calendar-only messaging.
- The first Playwright attempts exposed a stale local Supabase schema and old
  selectors from prior phases. Three existing additive migrations were applied
  locally without resetting data, and the smoke test was aligned with the
  current birth-month, multi-member schedule, calendar heading, and task copy.
- Full-app Playwright smoke passed with `ENABLE_FULL_APP=true`: 1 test covering
  family setup, child creation, schedule CRUD, chore generation, assignments,
  and My Today.
- `git diff --check` passed.
- Repository-wide `npm run format:check` still reports pre-existing formatting
  drift in unrelated files; all Phase 18 files were formatted directly.

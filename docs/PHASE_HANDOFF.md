# Phase Handoff

## Current Phase

Phase 20: Safe ICS Calendar Import

## Branch and Worktree

- Branch: `phase/20-ics-calendar-import`
- Worktree: `../family-app-phase-20-ics-calendar-import`
- Base branch: `main` at `d5d1139` (`Merge branch 'phase/19-recurring-schedule-events'`)

## Implemented Features

- Added preview-first `.ics` upload to the schedule page, with per-event
  selection and clear ready, duplicate, unsupported, and warning states.
- Limited files to 512 KB and 500 events, with at most 100 selected imports per
  confirmation.
- Parsed files in the browser for feedback and reparsed the original upload on
  the server before any write.
- Supported timed and all-day events, UTC/floating/IANA time zones, DTEND or
  DURATION, and daily/weekly/yearly/custom-weekday recurrence.
- Reported malformed required fields, monthly/complex recurrence, exception
  dates, recurrence overrides, cancellations, and proprietary time zones
  without discarding other supported events.
- Allowed parents to import for selected active members or the whole family;
  caregivers and children remain restricted to their own calendar.
- Preserved parent-only event deletion and all existing schedule RLS rules.
- Added nullable import provenance and family-scoped UID idempotency.
- Added a security-invoker database function that atomically writes each event,
  its attendees, and optional recurrence under existing RLS.
- Kept uploaded files in memory only; no Storage bucket or retained source file
  was added.
- Added parser, SQL permission/atomicity, and browser smoke coverage.

## Manual Setup Still Required

- Apply `20260814170000_ics_schedule_import.sql` to each reviewed remote
  Supabase environment using `supabase db push`.
- Install the updated lockfile during the normal build; it includes
  `ical.js@2.2.1`.
- No Supabase dashboard setting, Vercel dashboard setting, new environment
  variable, Storage bucket, paid service, or production deployment is required.
- Keep the existing `SUPABASE_SECRET_KEY` and `CHILD_SESSION_SECRET` server-only
  if Kid Mode import is used.

## Known Issues and Limitations

- ICS export is not included.
- Monthly recurrence, complex RRULE parts, EXDATE/RDATE/EXRULE,
  RECURRENCE-ID, and one-occurrence series editing are reported but not
  imported.
- Proprietary time zone names are rejected; UTC, floating times, and valid IANA
  time zones are supported.
- Duplicate UID detection is family-wide. A repeated UID is skipped rather than
  updating the previously imported event.
- Each event is atomic, while a batch can partially succeed if a later event is
  rejected; the result reports imported, duplicate, and failed counts.
- `npm install` reports six high-severity advisories in the existing locked
  dependency tree. Phase 20 did not run an automatic audit fix.

## Next Recommended Phase

- Review Phase 20 in the browser and merge after owner approval. A future phase
  can add ICS export or exception/one-occurrence recurrence behavior if needed.

## Checks

- Focused parser, recurrence, and schedule schema coverage passed: 3 files, 24
  tests.
- Repository-wide lint passed.
- TypeScript passed with Node 24.3.
- Full unit/component suite passed: 30 files, 133 tests.
- Production build passed with Next.js 16.2.10 and retained every existing app
  route in the output.
- Local additive migration applied successfully without resetting local data.
- `supabase db lint --local --level warning` passed with no schema errors.
- Rollback-only SQL verification passed for atomic writes, duplicate UIDs,
  child self-only assignment, and parent whole-family import.
- The full-app Playwright smoke passed, including upload preview, member
  assignment, recurring imported-event display, duplicate preview, and all
  existing family, chore, assignment, and My Today steps.
- Phase 20 files pass Prettier checks, and `git diff --check` passed.

## Recommended Commit

`feat(schedule): add safe ICS calendar import`

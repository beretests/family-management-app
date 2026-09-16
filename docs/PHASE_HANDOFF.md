# Phase Handoff

## Current Phase

Phase 35: Calendar Import and Date Entry Compatibility

## Branch and Worktree

- Branch: `phase/35-calendar-compatibility`
- Worktree: `/tmp/family-app-phase-35-calendar-compatibility`
- Base: clean local `main` at `26cf12a` (Phase 34 merged)
- Implementation approved by the owner after the compatibility investigation.
- The owner subsequently approved committing, merging to main, pushing to origin,
  and removing the merged phase worktree and branch.

## Implemented Features

- Read uploaded ICS bytes immediately and reuse the captured file for preview
  and import. Report read failures with retry/paste recovery instructions.
- Add pasted ICS with the same file validation, byte limits, parser, server
  authorization and UID duplicate protection as uploads.
- Ignore obsolete file reads and duplicate checks; clear preview/selection on
  source changes; lock the source while saving.
- Add text entry for timed, all-day and recurrence end dates while retaining
  native controls and a shared value for each field.
- Preserve invalid ranges and show errors instead of replacing the end time.
  Display the current date/time range and calendar time zone before saving.
- Strengthen server date validation to reject impossible or non-local values.
- Add component and browser coverage for input failures, exact timestamps,
  source changes, and source files removed after capture.

## Changed Files

- `components/schedule/{ics-import-form,ics-source-input,schedule-event-form,schedule-date-input}.tsx`
- `features/schedule/{all-day,date-input,schemas}.ts`
- `features/schedule/ics/{actions,source}.ts`
- `tests/unit/{ics-import-form,schedule-event-form}.test.tsx`
- `tests/unit/{schedule-all-day,schedule-schemas}.test.ts`
- `tests/e2e/parent-family-schedule-smoke.spec.ts`
- `docs/{ics-import,calendar-entry,DECISIONS,PHASE_HANDOFF}.md`

## Manual Setup and Costs

No new migrations, RLS policies, Supabase/Vercel dashboard settings, environment
variables, dependencies, paid services, or persistent storage. Hosted environments
still need the Phase 34 grant-repair migration if not already applied.

## Known Limitations

- Valid defaults cannot reveal an automation tool's unreceived intended values.
  Automation must assert values before saving and verify the saved event.
- A source file must be readable at initial selection; otherwise retry or paste.
- Existing incorrect series require review and explicit correction; this phase
  does not change existing calendar data or deploy to production.
- The host defaults to Node 18; checks use the available Node 24.3.0 runtime.

## Verification

Checks ran inside the phase worktree with Node 24.3.0:

- `npm ci --no-audit --no-fund --cache /tmp/family-calendar-npm-cache`: passed;
  installed the existing lockfile because the original dependency directory
  lacked `ical.js`. No manifest or lockfile change.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed, 50 files and 217 tests. The focused import suite passed
  again after the final accessible-label correction.
- `npm run test:e2e -- --grep 'creates family'`: passed against local Supabase;
  verifies exact saved timestamps, recurrence, import after source removal,
  pasted duplicate detection, and the existing family/chores flow.
- Stabilized an existing member-filter navigation wait and made the end-time
  selector exact after browser verification exposed ambiguous/timing-sensitive
  assertions. A paste test now accounts for textarea newline normalization.
- Targeted Prettier checks and `git diff --check`: passed.
- `npm run build`: passed with Next.js 16.3.3 after clearing the generated
  worktree cache and allowing the local CSS-worker port required by Turbopack.
  The initial sandbox build failure was environmental.

The three unrelated account-invitation browser tests were not rerun.

## Recommended Commit and Review

`fix(schedule): harden calendar import and date entry`

The owner approved the delivery sequence below. The branch and worktree above
record where this phase was implemented; after delivery, use the main checkout.
Verify main before removing the merged worktree and phase branch. Never force removal.

Review before committing:

```bash
cd /tmp/family-app-phase-35-calendar-compatibility
git status --short
git diff --stat
git diff
```

New files are untracked until staged; review the files listed above as well.
After committing, approved merging, and verification on main, cleanup from the
main repository can use:

```bash
git worktree remove /tmp/family-app-phase-35-calendar-compatibility
git branch -d phase/35-calendar-compatibility
git worktree prune
```

## Next Recommended Action

Test the original automation using the new paste/text options. Review and
explicitly correct any pre-existing incorrect calendar series.

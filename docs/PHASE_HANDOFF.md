# Phase Handoff

## Current Phase

Phase 24: Shared Grocery Shopping Lists and Retention

## Branch and Worktree

- Branch: `phase/24-grocery-shopping-list`
- Worktree: `../family-app-phase-24-grocery-shopping-list`
- Base branch: `main` at `24f555e`

## Implemented Features

- Added a responsive `/groceries` page and exposed Calendar plus Groceries as
  the default Family Planner navigation while the remaining product surface
  stays behind `ENABLE_FULL_APP`.
- Added one open household grocery list per family. Any active linked or Kid
  Mode family member can start a list when none exists, add an item, check or
  uncheck it, and remove it from the current list.
- Added a normalized, family-scoped grocery catalog. Newly typed items are
  saved automatically and can be searched, selected, and reused on later
  lists. Optional quantity, unit, category, and note fields are supported.
- Added parent-only lifecycle controls to complete, archive, reopen, or
  permanently delete lists and to hide or restore reusable catalog items.
- Added recent completed/archived list summaries with clear scheduled-deletion
  dates. Reopening a list clears its retention date and remains subject to the
  one-open-list constraint.
- Added `grocery_catalog_items`, `grocery_lists`, and `grocery_list_items`
  with normalized-name and one-open-list uniqueness, family-scoped foreign
  keys, explicit column grants, operation-specific RLS, and cascading list-item
  deletion that preserves catalog rows.
- Extended the existing secured daily maintenance route to delete eligible
  completed or archived lists after 90 days in batches of at most 100. Cleanup
  rechecks eligibility at deletion time, preserves concurrently reopened and
  open lists, preserves the catalog, and records a retention audit event for
  every list actually deleted.
- Updated the public landing page, architecture, data model, product decisions,
  local setup, Supabase/Vercel setup, retention guidance, roadmap, README, SQL
  verification notes, and browser coverage for the Phase 24 behavior.

## Manual Setup Still Required

- Apply `20260828190000_grocery_shopping_lists.sql` through the normal reviewed
  Supabase migration workflow before exposing Groceries in an environment.
- Confirm the existing Vercel daily request to
  `/api/cron/daily-maintenance` remains configured and that the existing
  `CRON_SECRET` and server-only `SUPABASE_SECRET_KEY` values are present. No
  new cron entry or environment variable is required.
- No Supabase dashboard setting, Storage bucket, Vercel dashboard change, paid
  service, or dependency is required.
- Production migration execution and deployment were not performed.

## Known Issues and Limitations

- Phase 24 intentionally supports one open list per family, not simultaneous
  lists for different stores or purposes.
- It does not include pantry inventory, low-stock thresholds, automatic item
  detection, prices/budgets, barcode scanning, store/aisle organization, push
  reminders, offline sync, or Supabase Realtime subscriptions.
- The page displays the ten most recently closed lists. Older eligible lists
  remain in the database until their 90-day cleanup date.
- Reusable catalog rows do not expire with list history. Parents can hide and
  restore them, but this phase does not permanently delete individual catalog
  rows.
- A permanent manual delete and automatic deletion after 90 days cannot be
  recovered through the app. The reusable item catalog remains available.
- The existing locked dependency tree still reports six high-severity npm
  audit findings. Phase 24 did not change dependency versions or run an
  automatic audit fix.

## Next Recommended Phase

- Review Phase 24 on a phone and desktop, apply the migration in a
  non-production Supabase environment, and test the secured daily maintenance
  response before approving merge.
- Treat Realtime collaboration, multiple/store-specific lists, pantry
  tracking, reminders, budgets, barcodes, and permanent catalog deletion as
  separately planned follow-up phases rather than expanding this MVP phase.

## Checks

- Repository-wide lint passed.
- TypeScript checking passed with incremental output disabled.
- Full unit/component suite passed: 39 files, 172 tests.
- All six local SQL verification scripts passed. RLS and family-table checks
  returned zero violations, the starter chore count remained 14, and grocery
  checks covered family isolation, contributor permissions, parent lifecycle,
  cross-family foreign keys, one-open-list enforcement, cascade deletion, and
  catalog preservation.
- The local Playwright parent flow passed in 56.5 seconds on a 390 x 844
  viewport. It covers family setup, grocery add/remove/check/uncheck,
  completion and retention messaging, saved-item reuse, responsive calendar
  actions, schedules, chores, assignments, and My Today. One earlier run
  reached the grocery assertions but encountered a transient local dev-server
  timeout later at `/chores`; the clean bounded rerun passed.
- Production build passed with Next.js 16.2.10 and includes `/groceries` and
  `/api/cron/daily-maintenance` in the dynamic route output.
- Phase TypeScript and Markdown files pass Prettier. SQL files are not handled
  by the configured Prettier parser.
- `git diff --check` passes.

## Recommended Commit

`feat(groceries): add shared shopping lists and retention cleanup`

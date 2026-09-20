# Phase Handoff

## Current Phase

Phase 37: Grocery List Improvements (implemented; commit, push, and PR authorized)

## Branch and Worktree

- Branch: `phase/37-grocery-list-improvements`
- Worktree: `/tmp/family-app-phase-37-grocery-list-improvements`
- Base: clean, synchronized `main` at `abb0752` (Phase 36 merged)

## Implemented Features

- Multiple open family grocery lists, with a selector, per-list progress, and
  a New list modal; existing saved-item prefill during list creation remains.
- Add item modal with searchable saved-item suggestions, editable defaults,
  duplicate indicators, keyboard navigation, focus restoration, and inline errors.
- Compact mobile rows with Bought/Put back and Remove icons, accessible labels,
  pending-state disabling, and 44px touch targets. Desktop retains button labels.
- CSV downloads for open and recent closed lists, including quantities, units,
  categories, notes, and bought status. Downloads quote/escape values, preserve
  Unicode, neutralize spreadsheet formula prefixes, and use safe filenames.
- Paginated catalog/list/item reads so API row limits do not truncate downloads.
- Existing family permissions and 90-day closed-list retention remain in place.

## Changed Files

- `app/(app)/groceries/page.tsx`
- `components/groceries/grocery-list-manager.tsx`
- `components/groceries/add-grocery-item-modal.tsx` (new)
- `components/groceries/download-grocery-list.tsx` (new)
- `features/groceries/actions.ts`, `queries.ts`, `types.ts`, `export.ts` (new)
- `supabase/migrations/20260920120000_multiple_open_grocery_lists.sql` (new)
- `tests/unit/grocery-list-manager.test.tsx`
- `tests/unit/grocery-export.test.ts`, `grocery-queries.test.ts` (new)
- `tests/sql/grocery-lists-verification.sql`
- `tests/e2e/grocery-list-improvements.spec.ts` (new)
- `tests/e2e/parent-family-schedule-smoke.spec.ts`
- `README.md`, `docs/DECISIONS.md`, `docs/architecture.md`,
  `docs/data-model.md`, `docs/product-decisions.md`, `docs/supabase-setup.md`,
  `docs/PHASE_HANDOFF.md`

## Manual Setup and Costs

The new migration replaces the one-open-list unique index with a non-unique
partial index. It changes no rows, grants, or RLS policies. It was applied to
local Supabase for verification. Apply it to the hosted Supabase database before
releasing this application version using the normal approved migration process.
No hosted migration or production deployment was performed.

No Vercel dashboard steps, new environment variables, packages, storage buckets,
or paid services. Additional lists/items use existing database and egress quota.
CSV generation runs in the browser. Do not roll back to the old single-list
reader after families create multiple open lists.

## Hosted Supabase Link Check (2026-09-20)

- Main checkout: `supabase/.temp/project-ref` is `dagltdgamhmsucrxxexh`.
- Main checkout's `.env.local` Supabase URL uses the same project reference.
- Phase worktree: no hosted project link (local Supabase verification only).
- Current CLI credentials list only **PowerPoint Prep** (`pvrixxoasnspcenxrgog`),
  not the family app's configured reference. The local link is confirmed, but
  hosted access/project name cannot be verified with this login. Do not select
  PowerPoint Prep just because it is the available project.

Sign in to the Supabase account with access to the family app and confirm
`supabase projects list` includes `dagltdgamhmsucrxxexh` with the intended name.
Then follow the guarded Phase 37 migration steps in `docs/supabase-setup.md`.
No link was changed and no hosted migration was applied during delivery.

## Verification

Checks ran in the phase worktree with Node 24.3.0:

- `npm ci --no-audit --no-fund`: passed with the unchanged lockfile. The initial
  offline attempt used the shell's Node 18 and lacked a cached package; retried
  with the installed Node 24 and registry access.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed, 51 files / 227 tests. After the pagination change, the
  focused grocery query/export/manager suite passed all 14 tests in 3 files,
  including the 2 newly added pagination/error tests.
- `supabase migration up --local`: applied only the Phase 37 migration.
- `psql ... -v ON_ERROR_STOP=1 -f tests/sql/grocery-lists-verification.sql`:
  passed and rolled back its fixtures. Verified multiple open lists, separate
  bought state, parent reopening alongside another open list, and child and
  outsider restrictions.
- `npm run test:e2e -- tests/e2e/grocery-list-improvements.spec.ts
tests/e2e/parent-family-schedule-smoke.spec.ts`: all 5 tests passed. Covered
  list selection, new/saved groceries, duplicate errors, cleared defaults,
  keyboard/focus behavior, icons/44px targets, no overflow at 390px and 320px,
  downloaded CSV contents, completion/reopening, and separate removal/bought state.
  The existing parent/child and schedule/chore smoke flows also passed.
- Reviewed desktop/mobile/modal screenshots in `test-results/`.
- `npm run build`: passed with Next.js 16.3.3 after enabling local worker
  process permission and moving aside the cache from the failed sandbox build.
  The initial build and its cached retry reported a worker-port restriction;
  a clean-cache build completed successfully.
- Targeted Prettier verification and `git diff --check`: passed.

The first unit focus assertion needed an explicit focus before a synthetic click
(jsdom does not focus clicked buttons); real browser focus restoration passed.

## Limitations and Follow-up

- Downloads are CSV, not PDF, and reflect the authorized data loaded on the page.
- The selected list is local UI state; a full reload defaults to the newest list.
- Recent closed-list history still shows the latest 10 lists, as before.
- Family-sized datasets are loaded into memory; pagination prevents truncation
  but does not introduce a virtualized UI for unusually large catalogs.

## Recommended Commit

`feat(groceries): support multiple lists and streamline shopping`

## Review, Merge and Cleanup

The owner authorized committing, pushing the phase branch, and opening a PR to
`main`. Review the PR before merging. Merge and production deployment require
separate owner approval. Keep the phase worktree until the PR is merged.

From the main repository, after confirming a clean tree and the approved base:

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff phase/37-grocery-list-improvements
```

Verify merged `main`, then (only after approved delivery) clean up:

```bash
git worktree remove /tmp/family-app-phase-37-grocery-list-improvements
git branch -d phase/37-grocery-list-improvements
git worktree prune
```

## Next Recommended Action

Review Phase 37 and coordinate the hosted migration with the approved app release.

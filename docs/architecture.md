# Architecture

This document reflects the implementation through the Phase 29 dependency
security update. It should be updated whenever a later phase changes app-facing
storage, cron, auth, database, or deployment behavior.

## Current Shape

```text
app/
  (app)/
    approvals/
    assignments/
    chores/
    dashboard/
    family/
      setup/
    groceries/
    leaderboard/
    my-today/
    reminders/
    rewards/
    schedule/
    settings/
      family/
  api/
    cron/
      daily-maintenance/
    test/
      session/
  (auth)/
    callback/
    sign-in/
    sign-up/
  globals.css
  layout.tsx
  page.tsx
components/
  assignments/
  auth/
  chores/
  family/
  groceries/
  leaderboard/
  layout/
  reminders/
  reviews/
  rewards/
  schedule/
  tasks/
  ui/
features/
  assignments/
  auth/
  chores/
  family/
  groceries/
  leaderboard/
  points/
  reminders/
  reviews/
  rewards/
  schedule/
  tasks/
lib/
  auth/
  cron/
  dates/
  groceries/
  permissions/
  storage/
  supabase/
supabase/
  config.toml
  migrations/
  seed.sql
tests/
  e2e/
  sql/
  unit/
docs/
```

The app renders a public landing page, Supabase Auth entry points, protected
family app pages, family setup, parent-managed child profiles, schedule
day/week views, a shared grocery list and reusable item catalog, chore
templates, assignments, kid task submission, parent review, rewards,
leaderboard, reminders, and daily maintenance.

## Runtime And Dependency Posture

- Next.js and its matching ESLint configuration are on 16.3.3, the August 2026
  Active LTS security release.
- The supported Node.js runtime remains 20.9 or newer; local verification uses
  Node 22.
- The lockfile resolves patched PostCSS, Sharp, brace-expansion, js-yaml, and
  nanoid versions without package overrides.
- `next dev` maintains the version-matched agent guidance block in `AGENTS.md`
  and the generated root-parameter type reference in `next-env.d.ts`.
- Dependency updates must pass both full-tree and production-only npm audits,
  clean install verification, application checks, and browser smoke tests.

## Request Flow

Public request flow:

1. Browser requests the root page.
2. Next.js App Router renders `app/page.tsx` as a server component.
3. The page reads static readiness metadata from `lib/bootstrap-readiness.ts`.
4. Shared presentational UI lives under `components/ui`.

Auth request flow:

1. `proxy.ts` calls `updateSession` to refresh Supabase auth cookies when
   Supabase is configured.
2. `/sign-in` and `/sign-up` render setup-aware forms.
3. Email/password actions run on the server through `features/auth/actions.ts`.
4. Google OAuth redirects to Supabase and returns through `/callback`.
5. `/callback` exchanges the auth code for a server-managed session.
6. `app/(app)/layout.tsx` verifies claims before rendering protected pages.

E2E test auth flow:

1. Playwright creates a confirmed local Supabase user from the Node test process.
2. The browser verifies the sign-in page is available.
3. Playwright posts credentials to `/api/test/session`.
4. That route returns 404 unless `E2E_TEST_AUTH_ENABLED=true`.
5. When enabled, the route uses normal Supabase password sign-in and sets SSR
   auth cookies for the browser context.

Database flow:

1. Supabase Auth establishes the user identity.
2. `profiles.id` maps to `auth.users.id`.
3. `family_members` and `family_member_auth_links` map auth users to family
   roles.
4. RLS helper functions resolve membership from `auth.uid()`.
5. Family-owned tables use `family_id` and RLS policies to constrain access.

Family profile flow:

1. `/dashboard` loads family context through `features/family/queries.ts`.
2. If no family exists, the user is sent to `/family/setup`.
3. Family setup creates `profiles`, `families`, and the first parent
   `family_members` row through Server Actions.
4. `/settings/family` lets active parents create child profiles, update notes,
   set status, invite other adults, and deactivate family members.
5. Adult invitations are tracked in `family_invitations`; invite acceptance
   validates the signed-in email before linking the Supabase Auth user to the
   pending adult `family_members` row.
6. Child invitations are tracked separately in `family_child_invitations` and
   target an existing active child. New addresses receive an admin invitation
   and create a password; confirmed existing accounts receive a non-creating
   magic link and retain their password. Exact-email acceptance atomically
   attaches the Auth profile/link only when the account has no active family
   access. Parent disconnect atomically revokes access while preserving the
   child and Kid Mode.
7. Invite links that use Supabase's token-fragment response pass through the
   invitation-only `/invite-callback` client bridge. It stores the auth session
   in cookies and removes the fragment before opening the accept page; ordinary
   PKCE callbacks remain server-exchanged.

Schedule flow:

1. `/schedule` loads the signed-in user's family context.
2. A small client synchronizer adds the browser IANA time zone to the schedule
   URL. The route derives local day/week boundaries in that zone and reads
   events through `features/schedule/queries.ts`.
3. Event reads return each schedule event once and include attendee IDs from
   `schedule_event_members`; older rows can still fall back to
   `schedule_events.member_id`.
4. Every active family member can create schedule events. Non-parents can assign
   and edit only events they created for themselves; only parents can delete.
5. Schedule actions validate input with Zod, resolve the active actor
   server-side, verify assigned members belong to the family, and rely on
   Supabase RLS for authenticated writes. Kid Mode is validated against its
   signed child session before using the server-only admin client.
6. Optional recurrence settings are read from `schedule_event_recurrences` and
   expanded only for the requested date range in the stored IANA time zone.
   Modified/cancelled local dates from `schedule_event_occurrence_overrides`
   are applied during expansion.
7. Single-occurrence changes call one atomic override function. "This and
   following" edits atomically truncate the earlier recurrence, create a new
   series, and transfer future exceptions; deletes atomically truncate and
   remove future exceptions. Entire-series changes retain the original event ID.
8. Multi-member event counts are based on unique occurrence IDs, even when the
   same event appears in multiple member lanes.
9. Conflict detection runs in `features/schedule/conflicts.ts` for overlapping
   events assigned to at least one shared family member.

Chore template flow:

1. `/chores` loads family context, house profile, starter templates, and family
   chore templates.
2. Parents save a house profile through `features/chores/actions.ts`.
3. The deterministic generator maps the house profile to seeded starter chore
   templates and skips family templates that already exist by title.
4. Generated templates are copied into `chore_templates` and
   `chore_template_subtasks` for parent review and editing.
5. Parents can create, update, and delete family templates.

Assignment and task flow:

1. `/assignments` previews and creates deterministic fair assignments.
2. `/my-today` shows assigned chores and checklists.
3. Kids with linked auth can submit task completion and private evidence when
   required.
4. `/approvals` lets parents approve/reject submissions and write points ledger
   entries.

Rewards and reminders flow:

1. `/rewards` lets parents manage non-monetary rewards and review redemptions.
2. `/leaderboard` computes a constructive family-private progress board.
3. `/reminders` shows in-app reminders.
4. `/api/cron/daily-maintenance` generates reminders, cleans old reviewed
   evidence, and deletes completed or archived grocery lists after 90 days when
   called with `CRON_SECRET`.

Grocery flow:

1. `/groceries` loads the current open list, reusable family item catalog, and
   recent completed or archived lists.
2. Any active linked or Kid Mode family member can start a list when none is
   open, add catalog or new items, check or uncheck items, and remove items.
3. Parents can complete, archive, reopen, or manually delete lists and hide or
   restore saved catalog items.
4. Server Actions resolve the family and actor rather than trusting submitted
   identifiers; operation-specific RLS policies enforce the same permissions.
5. Completed and archived lists receive a 90-day deletion date. Daily cleanup
   rechecks eligibility, deletes the list and its list items, records a
   retention audit event, and retains reusable catalog items.

Client provided `family_id`, `member_id`, and role values must be treated as
untrusted. Server-side code should resolve permissions from the authenticated
session and database membership.

## Boundaries

- `app/`: route entry points and layout composition.
- `components/`: reusable UI components.
- `features/`: feature-specific server actions and schemas.
- `lib/`: shared typed utilities and Supabase client helpers.
- `supabase/`: planned home for migrations, seed data, and optional functions.
- `tests/`: unit, integration, and e2e tests as features are added.

## Security Posture

The MVP uses Supabase Auth, Postgres RLS, private Storage, and one secured
Vercel Cron route.

Auth security decisions:

- uses `@supabase/ssr` with `getAll` and `setAll` cookie handlers
- uses `getClaims()` for protected route checks
- validates redirect targets so auth redirects stay on local app paths
- keeps Supabase secret keys out of browser code
- uses `SUPABASE_SECRET_KEY` for server-only maintenance
- keeps local Supabase CLI admin-key lookup in Node test code only
- keeps phone auth disabled by default
- enables RLS on app tables
- uses security-definer helpers to avoid trusting client role values
- validates family profile mutations with Zod Server Actions
- resolves active parent membership server-side before child management writes
- signs Kid Mode child-profile cookies with `CHILD_SESSION_SECRET`
- uses `SUPABASE_SECRET_KEY` for validated child-mode task writes because
  Supabase RLS cannot inspect app cookies
- validates schedule mutations with Zod Server Actions
- resolves the active family member server-side before schedule writes and
  enforces self-only create/edit for non-parents
- permits schedule deletion only for active parents at both the action and RLS
  layers
- checks assigned schedule members server-side before write attempts
- validates house profile and chore template mutations with Zod Server Actions
- resolves active parent membership server-side before house/chore writes
- keeps chore generation deterministic and free of paid AI/API calls
- guards the test-only session route behind `E2E_TEST_AUTH_ENABLED=true`
- guards cron maintenance behind `CRON_SECRET`
- keeps the remaining full product surface behind the server-side
  `ENABLE_FULL_APP` rollout flag while preserving all underlying routes and
  actions for reversible enablement
- keeps the shared `/groceries` route available beside Calendar, with
  family-member contribution checks in Server Actions and RLS
- keeps parent-only `/settings/family` navigation available in the limited
  Calendar/Groceries rollout while hiding it from child and caregiver accounts
- sends adult and child invitations only from server actions using the secret
  Supabase client; child acceptance and disconnect use atomic database functions
- keeps Auth-user email lookup and child-invitation acceptance functions
  service-role-only, uses neutral parent-facing delivery messages, and sends
  existing-account links with `shouldCreateUser: false`
- reuses the secured daily maintenance route for bounded 90-day grocery-list
  cleanup while preserving the reusable family catalog

The project reserves these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENABLE_PHONE_AUTH`
- `ENABLE_FULL_APP`
- `SUPABASE_SECRET_KEY`
- `CHILD_SESSION_SECRET`
- `CRON_SECRET`

Only `NEXT_PUBLIC_*` variables may be read in browser code. `ENABLE_FULL_APP`
is evaluated on the server and in Proxy so hiding navigation is paired with
route-level redirects.

## Free-Tier Posture

The MVP is compatible with Vercel Hobby deployment, but no deployment has been
performed by Codex.

The app does not include paid services, analytics, AI APIs, SMS, paid email,
queues, or external worker providers. Supabase Storage is used for private
evidence photos and is controlled by size limits and retention cleanup.

## Testing Strategy

Unit coverage includes auth schemas, family schemas, schedule validation,
conflicts, chore generation, assignment scoring, task submission schemas,
points, rewards, leaderboard scoring, reminders, grocery validation, and
evidence/grocery cleanup selection. The Playwright smoke test covers local
parent session setup, family setup, child creation, new and existing
child-account linking, password preservation, occupied-account rejection,
grocery list reuse/lifecycle, schedule event creation, chore generation,
assignments, and My Today rendering. SQL verification covers RLS, service-only
Auth lookup/acceptance, family-owned table shape, seed data, grocery
permissions, and the initial parent bootstrap policy.

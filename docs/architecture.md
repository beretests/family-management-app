# Architecture

This document reflects the Phase 6 auth, database, family profile, schedule,
and chore-template foundation. It should be updated whenever a later phase adds
app-facing storage, cron, or deployment behavior.

## Current Shape

```text
app/
  api/
    test/
      session/
  (app)/
    dashboard/
    family/
      setup/
    chores/
    schedule/
    settings/
      family/
  (auth)/
    callback/
    sign-in/
    sign-up/
  globals.css
  layout.tsx
  page.tsx
components/
  auth/
  family/
  chores/
  layout/
  schedule/
  ui/
features/
  auth/
  family/
  chores/
  schedule/
lib/
  auth/
  dates/
  permissions/
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

The app renders a public landing page, Supabase Auth entry points, a protected
dashboard, family setup, parent-managed child profile settings, and family
schedule day/week views, and parent-managed chore templates. Phase 6 connects
house-profile and chore-template UI to the existing house/chore tables.

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
   set status, and deactivate children.

Schedule flow:

1. `/schedule` loads the signed-in user's family context.
2. The route reads day/week events through `features/schedule/queries.ts`.
3. Parents create, update, and delete schedule events through Server Actions.
4. Schedule actions validate input with Zod, resolve active parent membership
   server-side, verify assigned members belong to the family, and then rely on
   existing Supabase RLS policies for database writes.
5. Conflict detection runs in `features/schedule/conflicts.ts` for overlapping
   events assigned to the same family member.

Chore template flow:

1. `/chores` loads family context, house profile, starter templates, and family
   chore templates.
2. Parents save a house profile through `features/chores/actions.ts`.
3. The deterministic generator maps the house profile to seeded starter chore
   templates and skips family templates that already exist by title.
4. Generated templates are copied into `chore_templates` and
   `chore_template_subtasks` for parent review and editing.
5. Parents can create, update, and delete family templates. Assignment and task
   instance generation remain future phases.

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

Phase 6 adds app-facing CRUD for house profiles and family chore templates. It
still has no file storage or cron route.

Auth security decisions:

- uses `@supabase/ssr` with `getAll` and `setAll` cookie handlers
- uses `getClaims()` for protected route checks
- validates redirect targets so auth redirects stay on local app paths
- keeps service-role and secret keys out of browser code
- keeps the E2E service-role lookup in Node test code only
- keeps phone auth disabled by default
- enables RLS on app tables
- uses security-definer helpers to avoid trusting client role values
- validates family profile mutations with Zod Server Actions
- resolves active parent membership server-side before child management writes
- validates schedule mutations with Zod Server Actions
- resolves active parent membership server-side before schedule management
  writes
- checks assigned schedule members server-side before write attempts
- validates house profile and chore template mutations with Zod Server Actions
- resolves active parent membership server-side before house/chore writes
- keeps chore generation deterministic and free of paid AI/API calls
- guards the test-only session route behind `E2E_TEST_AUTH_ENABLED=true`

The project reserves these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENABLE_PHONE_AUTH`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Only `NEXT_PUBLIC_*` variables may be read in browser code.

## Free-Tier Posture

Phase 6 runs locally and is compatible with Vercel Hobby deployment, but no
deployment has been performed.

The app does not include paid services, analytics, AI APIs, SMS, storage,
queues, or external cron providers.

## Testing Strategy

Phase 6 includes unit coverage for schedule validation, same-member conflict
detection, chore validation, and deterministic chore generation. It also
includes a Playwright smoke test for local parent session setup, family setup,
child creation, schedule event creation, and generated chore templates. SQL
verification notes still cover RLS, family-owned table shape, seed data, and the
initial parent bootstrap policy.
Later phases should add tests for:

- Supabase auth flows
- parent/child permissions
- RLS policy behavior
- additional E2E coverage for edit/delete flows
- deterministic assignment
- points ledger calculations
- evidence cleanup selection

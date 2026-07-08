# Architecture

This document reflects the Phase 3 auth and database foundation. It should be
updated whenever a later phase adds app-facing data access, storage, cron, or
deployment behavior.

## Current Shape

```text
app/
  (app)/
    dashboard/
  (auth)/
    callback/
    sign-in/
    sign-up/
  globals.css
  layout.tsx
  page.tsx
components/
  auth/
  layout/
  ui/
features/
  auth/
lib/
  auth/
  supabase/
supabase/
  config.toml
  migrations/
  seed.sql
tests/
  sql/
  unit/
docs/
```

The app renders a public landing page, Supabase Auth entry points, and a
protected dashboard placeholder. Phase 3 adds the database schema and RLS
foundation but does not yet connect UI screens to family data.

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

Database flow:

1. Supabase Auth establishes the user identity.
2. `profiles.id` maps to `auth.users.id`.
3. `family_members` and `family_member_auth_links` map auth users to family
   roles.
4. RLS helper functions resolve membership from `auth.uid()`.
5. Family-owned tables use `family_id` and RLS policies to constrain access.

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

Phase 3 has no app-facing database CRUD UI, file storage, or cron route.

Auth security decisions:

- uses `@supabase/ssr` with `getAll` and `setAll` cookie handlers
- uses `getClaims()` for protected route checks
- validates redirect targets so auth redirects stay on local app paths
- keeps service-role and secret keys out of browser code
- keeps phone auth disabled by default
- enables RLS on app tables
- uses security-definer helpers to avoid trusting client role values

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

Phase 3 runs locally and is compatible with Vercel Hobby deployment, but no
deployment has been performed.

The app does not include paid services, analytics, AI APIs, SMS, storage,
queues, or external cron providers.

## Testing Strategy

Phase 3 includes SQL verification notes for RLS and family-owned table shape.
Later phases should add tests for:

- Supabase auth flows
- parent/child permissions
- RLS policy behavior
- schedule conflict detection
- deterministic chore generation and assignment
- points ledger calculations
- evidence cleanup selection

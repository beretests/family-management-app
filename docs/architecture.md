# Architecture

This document reflects the Phase 2 auth foundation. It should be updated
whenever a later phase adds data access, storage, cron, or deployment behavior.

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
tests/
  unit/
docs/
```

The app renders a public landing page, Supabase Auth entry points, and a
protected dashboard placeholder.

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

Phase 3 should add Supabase migrations and RLS for family-owned data. Client
provided `family_id`, `member_id`, and role values must be treated as untrusted.
Server-side code should resolve permissions from the authenticated session and
database membership.

## Boundaries

- `app/`: route entry points and layout composition.
- `components/`: reusable UI components.
- `features/`: feature-specific server actions and schemas.
- `lib/`: shared typed utilities and Supabase client helpers.
- `supabase/`: planned home for migrations, seed data, and optional functions.
- `tests/`: unit, integration, and e2e tests as features are added.

## Security Posture

Phase 2 has no database access, file storage, or cron route.

Auth security decisions:

- uses `@supabase/ssr` with `getAll` and `setAll` cookie handlers
- uses `getClaims()` for protected route checks
- validates redirect targets so auth redirects stay on local app paths
- keeps service-role and secret keys out of browser code
- keeps phone auth disabled by default

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

Phase 2 runs locally and is compatible with Vercel Hobby deployment, but no
deployment has been performed.

The app does not include paid services, analytics, AI APIs, SMS, storage,
queues, or external cron providers.

## Testing Strategy

Phase 2 includes Vitest coverage for bootstrap readiness, auth redirect
normalization, and email/password validation. Later phases should add tests for:

- Supabase auth flows
- parent/child permissions
- RLS policy behavior
- schedule conflict detection
- deterministic chore generation and assignment
- points ledger calculations
- evidence cleanup selection

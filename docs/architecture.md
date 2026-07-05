# Architecture

This document reflects the Phase 1 foundation. It should be updated whenever a
later phase adds auth, data access, storage, cron, or deployment behavior.

## Current Shape

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  ui/
lib/
tests/
  unit/
docs/
```

The app currently renders a static dashboard-style preview for the target family
workflow. It is intentionally not connected to Supabase or any external service.

## Request Flow

Phase 1 request flow:

1. Browser requests the root page.
2. Next.js App Router renders `app/page.tsx` as a server component.
3. The page reads static readiness metadata from `lib/bootstrap-readiness.ts`.
4. Shared presentational UI lives under `components/ui`.

## Future Auth and Data Flow

Phase 2 should add Supabase Auth with secure SSR-compatible session handling and
protected app routes.

Phase 3 should add Supabase migrations and RLS for family-owned data. Client
provided `family_id`, `member_id`, and role values must be treated as untrusted.
Server-side code should resolve permissions from the authenticated session and
database membership.

## Boundaries

- `app/`: route entry points and layout composition.
- `components/`: reusable UI components.
- `lib/`: shared typed utilities that are not tied to a single page.
- `features/`: planned home for feature-specific domain logic in later phases.
- `supabase/`: planned home for migrations, seed data, and optional functions.
- `tests/`: unit, integration, and e2e tests as features are added.

## Security Posture

Phase 1 has no secrets, database access, file storage, cron route, or auth
session handling.

The project already reserves these environment variables for later phases:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENABLE_PHONE_AUTH`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Only `NEXT_PUBLIC_*` variables may be read in browser code.

## Free-Tier Posture

Phase 1 runs locally and is compatible with Vercel Hobby deployment, but no
deployment has been performed.

The app does not include paid services, analytics, AI APIs, SMS, storage, queues,
or external cron providers.

## Testing Strategy

Phase 1 includes Vitest for unit tests and validates the bootstrap readiness
metadata. Later phases should add tests for:

- Supabase auth flows
- parent/child permissions
- RLS policy behavior
- schedule conflict detection
- deterministic chore generation and assignment
- points ledger calculations
- evidence cleanup selection

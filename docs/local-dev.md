# Local Development

This guide covers local development through Phase 9. Supabase Auth is wired for
parent and caregiver accounts, the initial schema/RLS policies are available
through Supabase CLI migrations, and signed-in parents can create family and
child profiles, family schedule events, chore templates, assignments, and kid
task submissions, then review submitted chores and award points.

## Requirements

- Node.js 20.9 or newer for the current Next.js toolchain.
- npm 10 or newer.

The current environment used for verification was:

- Node.js v24.3.0
- npm 11.4.2

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

The public landing page can run without Supabase values. Auth routes show a
setup notice until Supabase public env vars are configured.

Create `.env.local` from `.env.example` when values are available:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Rules:

- Keep `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false` unless the owner explicitly approves
  SMS provider setup and cost risk.
- Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or
  `CRON_SECRET` to browser code.
- Never commit `.env.local` or real secrets.

## Checks

Run these before handing off a phase:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the browser smoke test when local Supabase is running and migrations are
applied:

```bash
npm run test:e2e
```

The E2E suite uses Playwright with system Chrome by default. Set
`PLAYWRIGHT_BROWSER_CHANNEL` if you need a different installed browser channel.
The Playwright-managed dev server runs on `http://127.0.0.1:3106` by default
and enables `E2E_TEST_AUTH_ENABLED=true`, which turns on the guarded local-only
test session route at `/api/test/session`. Without that flag, the route returns 404. The test runner reads local Supabase connection details from environment
variables or `supabase status -o env`; do not commit service-role values.

## Supabase

Supabase dashboard setup is required to test real sign-up/sign-in flows. Phase 9
also requires the local or remote database and Storage migrations to be applied.

See:

- `docs/auth-setup.md`
- `docs/supabase-setup.md`
- `docs/data-model.md`

For local database work:

```bash
supabase start
supabase db reset
```

After signing in locally, visit `/dashboard`. If no family exists yet, the app
links to `/family/setup`; family management lives at `/settings/family`, day/week
schedule views live at `/schedule`, chore template setup lives at `/chores`,
assignment planning lives at `/assignments`, and kid task submission lives at
`/my-today`. Parent review lives at `/approvals`.

This project uses non-default local Supabase ports to avoid conflicts with other
local projects:

- API: `http://127.0.0.1:55421`
- Database: `postgresql://postgres:postgres@127.0.0.1:55422/postgres`
- Studio: `http://127.0.0.1:55423`
- Email testing: `http://127.0.0.1:55424`
- Analytics: `http://127.0.0.1:55427`

Phase 8 creates a private `task-evidence` bucket through migration. Evidence
uploads are limited to JPEG, PNG, WebP, or GIF files up to 5 MB.

Later phases will add automated retention cleanup.

## Vercel

No Vercel deployment is required in Phase 9.

See `docs/vercel-setup.md` for planned env var and callback URL setup.

Later phases will add:

- importing the repo
- optional low-frequency cron setup
- free-tier usage monitoring

## Cost Guardrails

Phase 9 adds no paid services. Phase 8 added private Supabase Storage usage for evidence photos, which can
consume free-tier storage and egress. Do not add SMS, paid email, paid
analytics, paid AI APIs, paid queues, or observability without owner approval.

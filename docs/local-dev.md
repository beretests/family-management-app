# Local Development

This guide covers local development through Phase 12. Supabase Auth is wired for
parent and caregiver accounts, the initial schema/RLS policies are available
through Supabase CLI migrations, and signed-in parents can create family and
child profiles, family schedule events, chore templates, assignments, and kid
task submissions, review submitted chores and award points, manage rewards, and
view the family leaderboard and reminders. Deployment readiness docs are now in
place.

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
CRON_SECRET=
```

Rules:

- Keep `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false` unless the owner explicitly approves
  SMS provider setup and cost risk.
- Never expose `SUPABASE_SECRET_KEY` or `CRON_SECRET` to browser code.
- Use Supabase's current `sb_secret_...` key for `SUPABASE_SECRET_KEY`; do not
  use the legacy `service_role` key for production app deployment.
- The daily maintenance route requires `CRON_SECRET` and a server-only Supabase
  admin key before it can generate reminders or clean Storage metadata.
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
variables or `supabase status -o env`; do not commit local CLI admin keys.

## Supabase

Supabase dashboard setup is required to test real sign-up/sign-in flows. The
local or remote database and Storage migrations must be applied for the full app
surface.

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
`/my-today`. Parent review lives at `/approvals`, rewards live at `/rewards`,
the constructive family leaderboard lives at `/leaderboard`, and reminders live
at `/reminders`.

This project uses non-default local Supabase ports to avoid conflicts with other
local projects:

- API: `http://127.0.0.1:55421`
- Database: `postgresql://postgres:postgres@127.0.0.1:55422/postgres`
- Studio: `http://127.0.0.1:55423`
- Email testing: `http://127.0.0.1:55424`
- Analytics: `http://127.0.0.1:55427`

Phase 8 creates a private `task-evidence` bucket through migration. Evidence
uploads are limited to JPEG, PNG, WebP, or GIF files up to 5 MB.

Phase 11 adds automated retention cleanup through the secured daily maintenance
route.

## Vercel

No Vercel deployment is required in Phase 12.

See `docs/deployment-checklist.md` and `docs/vercel-setup.md` for env vars,
callback URLs, cron setup, and free-tier usage monitoring.

## Cost Guardrails

The MVP adds no paid services, SMS, email provider, external workers, or push
notification provider. It uses one low-frequency Vercel Cron route and keeps
reminders in-app by default. Private Supabase Storage usage for evidence photos
can consume free-tier storage and egress; retention cleanup reduces long-term
storage growth.

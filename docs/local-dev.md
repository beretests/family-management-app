# Local Development

This guide covers local development through Phase 2. Supabase Auth is wired for
parent and caregiver accounts. Database, RLS, storage, and deployment setup are
planned for later phases.

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

## Supabase

Supabase dashboard setup is required to test real sign-up/sign-in flows.

See:

- `docs/auth-setup.md`
- `docs/supabase-setup.md`

Later phases will add:

- database migrations and RLS
- private evidence storage bucket
- storage policies and retention cleanup

## Vercel

No Vercel deployment is required in Phase 2.

See `docs/vercel-setup.md` for planned env var and callback URL setup.

Later phases will add:

- importing the repo
- optional low-frequency cron setup
- free-tier usage monitoring

## Cost Guardrails

Phase 2 adds no paid services. Do not add SMS, paid email, paid analytics, paid
AI APIs, paid storage, queues, or observability without owner approval.

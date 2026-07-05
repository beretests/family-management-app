# Local Development

This guide covers the Phase 1 app foundation. Supabase Auth, database, RLS,
storage, and deployment setup are planned for later phases.

## Requirements

- Node.js 20.9 or newer for the current Next.js toolchain.
- npm 10 or newer.

The current environment used for Phase 1 verification was:

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

Phase 1 can run without Supabase values. The placeholders are present now so
later phases can add Auth, RLS, storage, and cron without renaming variables.

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

No Supabase dashboard setup is required in Phase 1.

Later phases will document:

- Supabase project creation
- Auth provider setup
- database migrations and RLS
- private evidence storage bucket
- storage policies and retention cleanup

## Vercel

No Vercel deployment is required in Phase 1.

Later phases will document:

- importing the repo
- adding environment variables
- configuring auth callback URLs
- setting `NEXT_PUBLIC_APP_URL`
- optional low-frequency cron setup
- free-tier usage monitoring

## Cost Guardrails

Phase 1 adds no paid services. Do not add SMS, paid email, paid analytics, paid
AI APIs, paid storage, queues, or observability without owner approval.

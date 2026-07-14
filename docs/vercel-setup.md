# Vercel Setup

This app targets Vercel Hobby/free tier.

## Project Import

1. Import the GitHub repository into Vercel.
2. Use the Next.js framework preset.
3. Keep the install command as `npm install`.
4. Keep the build command as:

```bash
npm run build
```

5. Deploy from the production branch, normally `main`.

No production deployment is performed by Codex unless the owner explicitly
requests it.

## Environment Variables

Add these variables for Production. Add them for Preview only if preview auth
testing is needed.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
SUPABASE_SECRET_KEY=
CHILD_SESSION_SECRET=
CRON_SECRET=
```

Rules:

- `NEXT_PUBLIC_APP_URL` must be the deployed app origin, for example
  `https://your-app.vercel.app` or the custom domain.
- Use Supabase's `sb_publishable_...` key for
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Use Supabase's `sb_secret_...` key for `SUPABASE_SECRET_KEY`.
- Do not configure the legacy `service_role` key for production app use.
- Set `CHILD_SESSION_SECRET` to a long random value for Kid Mode cookie signing.
- Keep `CRON_SECRET` server-only.
- Changing Vercel env vars requires a new deployment.

## Supabase Redirect URLs

Add each deployed callback URL in Supabase Auth URL configuration:

```text
https://your-app.vercel.app/callback
https://your-custom-domain.example/callback
```

For preview auth testing, add a tightly scoped preview callback URL. Avoid broad
wildcards unless the risk is understood.

## Cron

Phase 11 added one daily maintenance route:

```text
/api/cron/daily-maintenance
```

`vercel.json` configures:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-maintenance",
      "schedule": "0 9 * * *"
    }
  ]
}
```

The route expects:

```text
Authorization: Bearer <CRON_SECRET>
```

Vercel Hobby cron is low-frequency and not minute-precise. The maintenance route
is idempotent and batch-limited, so it is safe to rerun.

## Free-Tier Guardrails

- Do not add paid analytics, queues, observability, email, SMS, AI APIs, or
  external worker services without owner approval.
- Monitor Vercel usage after enabling cron and evidence uploads.
- Keep cron daily or low-frequency.
- Watch function logs for maintenance failures, especially evidence cleanup
  errors caused by missing `SUPABASE_SECRET_KEY`.
- Large evidence uploads can still consume function time and Supabase
  storage/egress.

## Deployment Smoke Test

After deployment:

1. Open `NEXT_PUBLIC_APP_URL`.
2. Confirm the landing page loads.
3. Sign in with a test parent account.
4. Confirm `/dashboard` loads.
5. Confirm `/schedule`, `/chores`, `/assignments`, `/my-today`, `/approvals`,
   `/rewards`, `/leaderboard`, and `/reminders` load for the test family.
6. Confirm Supabase redirects return through `/callback`.
7. Confirm `/api/cron/daily-maintenance` returns `401` without the cron secret.
8. Trigger the cron route manually only with the correct secret from a trusted
   environment.

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
ENABLE_FULL_APP=false
SUPABASE_SECRET_KEY=
CHILD_SESSION_SECRET=
CRON_SECRET=
```

Rules:

- `NEXT_PUBLIC_APP_URL` must be the deployed app origin, for example
  `https://your-app.vercel.app` or the custom domain.
- Keep `ENABLE_FULL_APP=false` for the Calendar/Groceries/Family rollout. Set
  it to `true` only when the complete existing app should be visible and
  reachable again.
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

The same callback handles sign-up, OAuth, adult invitations, and password
recovery. Password recovery uses a query parameter to continue to
`/reset-password`, so it does not require another Vercel environment variable
or Supabase redirect entry.

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
is idempotent and batch-limited, so it is safe to rerun. Phase 24 reuses this
same daily invocation for 90-day grocery-list cleanup and adds no cron entry.

## Free-Tier Guardrails

- Do not add paid analytics, queues, observability, email, SMS, AI APIs, or
  external worker services without owner approval.
- Monitor Vercel usage after enabling cron and evidence uploads.
- Keep cron daily or low-frequency.
- Watch function logs for maintenance failures, especially evidence or grocery
  cleanup errors caused by missing `SUPABASE_SECRET_KEY`.
- Large evidence uploads can still consume function time and Supabase
  storage/egress.

## Deployment Smoke Test

After deployment:

1. Open `NEXT_PUBLIC_APP_URL`.
2. Confirm the landing page loads.
3. Sign in with a test parent account.
4. With `ENABLE_FULL_APP=false`, confirm `/schedule`, `/groceries`, and
   parent-only `/settings/family` load, Calendar offers Whole family and
   active-member views, a child cannot see Family navigation, and a request for
   `/dashboard` redirects to `/schedule`.
5. In a Preview deployment with `ENABLE_FULL_APP=true`, confirm `/dashboard`,
   `/schedule`, `/chores`, `/assignments`, `/my-today`, `/approvals`, `/rewards`,
   `/leaderboard`, `/reminders`, and `/groceries` load for the test family.
6. Confirm Supabase password recovery, adult invites, and child email invites
   return through `/callback`. For a child invite, verify acceptance connects
   the existing child profile and parent disconnect preserves it.
7. Request a password reset from `/forgot-password`, open the email in the same
   browser, update the password, and confirm the app returns to `/sign-in` and
   accepts the new password.
8. Confirm `/api/cron/daily-maintenance` returns `401` without the cron secret.
9. Trigger the cron route manually only with the correct secret from a trusted
   environment.

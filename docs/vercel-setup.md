# Vercel Setup

Phase 2 does not deploy the app, but auth configuration needs Vercel-compatible
environment planning.

## Environment Variables

When a Vercel project exists, add these variables for Preview and Production as
appropriate:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

For production, `NEXT_PUBLIC_APP_URL` should be the public app URL, for example:

```text
https://your-app.vercel.app
```

## Supabase Redirect URLs

Add the deployed callback URL to Supabase:

```text
https://your-app.vercel.app/callback
```

If you use custom domains or Vercel preview deployments for auth testing, add
the corresponding callback URLs in Supabase.

## Free-Tier Notes

- No Vercel Cron jobs are configured in Phase 2.
- No paid analytics, queues, observability, email, or SMS providers are added.
- Monitor Vercel usage before enabling features with background jobs or image
  optimization.

## Build Command

The standard build command is:

```bash
npm run build
```

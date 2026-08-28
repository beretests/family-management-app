# Deployment Checklist

Use this checklist before deploying the MVP to Vercel.

## 1. Local Verification

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Optional with local Supabase running:

```bash
supabase db reset
npm run test:e2e
```

## 2. Supabase Project

- Create or open a Supabase project.
- Copy the Project URL.
- Create/copy a publishable key: `sb_publishable_...`.
- Create/copy a secret key: `sb_secret_...`.
- Do not use the legacy `service_role` key for production app deployment.
- Configure Auth Site URL and Redirect URLs.
- Enable email/password auth.
- Configure Google OAuth if used.
- Keep phone auth disabled unless SMS cost is approved.
- Apply migrations with `supabase db push`.
- Confirm the private `task-evidence` bucket exists.
- Confirm RLS is enabled on app tables.

## 3. Vercel Project

- Import the GitHub repository.
- Use the Next.js preset.
- Set build command to `npm run build`.
- Set Production env vars:

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

- Confirm `NEXT_PUBLIC_APP_URL` matches the deployed origin.
- Confirm `ENABLE_FULL_APP=false` for a Calendar/Groceries/Family production
  rollout. Test
  `true` in Preview before exposing the complete app.
- Confirm `vercel.json` includes `/api/cron/daily-maintenance`.
- Redeploy after env var changes.

## 4. Supabase Redirects For Vercel

Add:

```text
https://your-app.vercel.app/callback
https://your-custom-domain.example/callback
```

Add preview callback URLs only when preview auth testing is needed.

## 5. Production Smoke Test

- Landing page loads.
- Parent can sign up/sign in.
- Parent can create or open a family.
- Calendar loads in whole-family and individual-member views.
- Parent-only Family settings load and can send a test child invitation.
- The invited child connects to the existing profile, can sign in, and cannot
  see Family navigation; parent disconnect preserves the child profile.
- With `ENABLE_FULL_APP=false`, full-app routes redirect to Calendar.
- In a Preview with `ENABLE_FULL_APP=true`, Dashboard, Chores, Assignments, My
  Today, Approvals, Rewards, Leaderboard, Reminders, Family settings, and Kid
  Mode still load.
- Cron route returns `401` without `CRON_SECRET`.
- Evidence bucket remains private.

## 6. Free-Tier Review

- Supabase database usage is within free-tier expectations.
- Supabase Storage usage is within free-tier expectations.
- Supabase egress is monitored after evidence uploads.
- Vercel function and cron usage is monitored.
- No SMS, paid email, paid analytics, paid AI, queue, or external worker service
  is enabled.

## 7. Rollback Notes

- Keep migrations additive unless a destructive migration is explicitly
  approved.
- Vercel deployments can be rolled back from the Vercel dashboard.
- Rotate `SUPABASE_SECRET_KEY` and `CRON_SECRET` if they are exposed.

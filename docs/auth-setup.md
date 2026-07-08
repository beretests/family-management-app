# Auth Setup

Phase 2 adds Supabase Auth for parent and caregiver accounts.

Implemented auth paths:

- email/password sign-up
- email/password sign-in
- Google OAuth sign-in entry point
- sign-out
- protected `/dashboard` route
- SSR cookie handling through `@supabase/ssr`

Not implemented in this phase:

- database profiles
- family membership
- child mode/PIN sessions
- RLS policies
- phone/SMS auth

## Environment Variables

Set these locally in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
```

Keep these server-only placeholders for later phases:

```bash
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Rules:

- Only `NEXT_PUBLIC_*` values may be read by browser code.
- Do not commit real secret values.
- Keep `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false` unless the owner approves SMS
  provider setup and possible cost.

## Supabase Dashboard

1. Create or open the Supabase project.
2. Go to Authentication settings.
3. Set the Site URL:

```text
http://localhost:3000
```

4. Add local Redirect URLs:

```text
http://localhost:3000/callback
```

5. Enable email auth. Supabase hosted email sending has limits; use it for
   development and low-volume testing unless the owner approves a separate
   provider.
6. Configure Google OAuth:
   - Create OAuth credentials in Google Cloud.
   - Add the Supabase callback URL shown in the Supabase provider setup.
   - Add the Google client ID and secret in Supabase.
   - Enable the provider.
7. Leave phone auth disabled. Phone auth requires an SMS provider such as
   Twilio, MessageBird, or Vonage and can incur cost.

## Auth Routes

- `/sign-in`: email/password and Google sign-in.
- `/sign-up`: parent/caregiver email/password sign-up.
- `/callback`: exchanges Supabase auth codes for a server-managed session.
- `/dashboard`: protected placeholder dashboard.

Redirect safety:

- `next` parameters must be local absolute paths such as `/dashboard`.
- external URLs and protocol-relative URLs fall back to `/dashboard`.

## Local Manual Verification

With Supabase env vars configured:

1. Start the app with `npm run dev`.
2. Open `/dashboard` in a private browser window.
3. Confirm unauthenticated access redirects to `/sign-in?next=/dashboard`.
4. Create an account with email/password.
5. Confirm the email if your Supabase project requires confirmation.
6. Sign in and confirm `/dashboard` renders.
7. Sign out and confirm you return to `/`.
8. Test Google sign-in after Google provider setup is complete.

Without Supabase env vars configured:

- `/sign-in` and `/sign-up` render disabled forms with a setup notice.
- `/dashboard` renders a setup-required message instead of throwing during local
  development or build.

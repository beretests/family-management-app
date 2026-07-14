# Auth Setup

The app uses Supabase Auth for parent and caregiver accounts, with optional
linked child auth profiles for older kids.

Implemented auth paths:

- email/password sign-up
- email/password sign-in
- Google OAuth sign-in entry point
- sign-out
- protected app routes
- SSR cookie handling through `@supabase/ssr`
- parent-managed Kid Mode/PIN profile switching
- optional linked child auth profiles for older kids
- parent-created invitations for other parents or caregivers
- guarded local-only E2E session helper

Not implemented by default:

- phone/SMS auth
- paid email provider

## Environment Variables

Set these locally in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
SUPABASE_SECRET_KEY=
CHILD_SESSION_SECRET=
CRON_SECRET=
```

Rules:

- Only `NEXT_PUBLIC_*` values may be read by browser code.
- Use Supabase's current `sb_publishable_...` key for the browser-safe
  publishable key.
- Use Supabase's current `sb_secret_...` key for server-only maintenance.
- Do not use the legacy `service_role` key for production app deployment.
- Set `CHILD_SESSION_SECRET` to a long random value. It signs HttpOnly Kid Mode
  cookies and must be server-only.
- Do not commit real secret values.
- Keep `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false` unless the owner approves SMS
  provider setup and possible cost.

## Supabase Dashboard

1. Create or open the Supabase project.
2. Go to Authentication settings.
3. Set the local Site URL:

```text
http://localhost:3000
```

4. Add local Redirect URLs:

```text
http://localhost:3000/callback
```

5. Add production Redirect URLs after Vercel deployment:

```text
https://your-app.vercel.app/callback
https://your-custom-domain.example/callback
```

6. Enable email auth. Supabase hosted email sending has limits; use it for
   development and low-volume testing unless the owner approves a separate
   provider.
7. Configure Google OAuth:
   - Create OAuth credentials in Google Cloud.
   - Add the Supabase callback URL shown in the Supabase provider setup.
   - Add the Google client ID and secret in Supabase.
   - Enable the provider.
8. Leave phone auth disabled. Phone auth requires an SMS provider such as
   Twilio, MessageBird, or Vonage and can incur cost.

## Auth Routes

- `/sign-in`: email/password and Google sign-in.
- `/sign-up`: parent/caregiver email/password sign-up.
- `/callback`: exchanges Supabase auth codes for a server-managed session.
- `/dashboard`: protected family dashboard.
- `/kid-mode`: unlocks or exits a parent-managed child profile.

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
9. As a parent, add a child, set a Kid Mode PIN in Family settings, unlock the
   child from `/kid-mode`, and confirm parent-only routes redirect away.
10. As a parent, invite another parent or caregiver from Family settings. The
    invited adult must sign in with the invited email address and accept from
    `/family/invite/accept?invite=<id>`.

## Kid Mode Security

Kid Mode is household profile switching under a signed-in parent account. It is
not equivalent to a separate child password.

- PINs are hashed in `family_member_pin_credentials`; plaintext PINs are never
  stored.
- The selected child profile is stored in a short-lived HttpOnly cookie signed
  with `CHILD_SESSION_SECRET`.
- Server actions validate the parent Supabase session, the signed child cookie,
  and the target task/member before allowing child actions.
- Task writes in Kid Mode use `SUPABASE_SECRET_KEY` server-side after validation
  because Supabase RLS can only see the parent JWT, not the app's child cookie.
- Older kids can use real Supabase Auth accounts linked through
  `family_member_auth_links`; those sessions continue through normal RLS.

## Adult Family Invitations

Parents can invite another `parent` or `caregiver` by email. The app creates a
pending adult family member and `family_invitations` row, then sends a Supabase
Auth invite email with `auth.admin.inviteUserByEmail`.

- Requires server-only `SUPABASE_SECRET_KEY`.
- Invite links redirect through `/callback` and then to
  `/family/invite/accept`.
- The accepting user must be signed in with the same email address that was
  invited.
- Parent role invites can manage family settings after acceptance.
- Caregiver role invites are linked to the family but do not get parent-only
  settings access.
- Pending invites can be revoked from Family settings.
- At least one accepted active parent must remain in the family.

Without Supabase env vars configured:

- `/sign-in` and `/sign-up` render disabled forms with a setup notice.
- protected routes render setup-required states instead of throwing during local
  development or build.

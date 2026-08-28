# Auth Setup

The app uses Supabase Auth for parent and caregiver accounts, with optional
linked child auth profiles for older kids.

Implemented auth paths:

- email/password sign-up
- email/password sign-in
- email password recovery
- Google OAuth sign-in entry point
- sign-out
- protected app routes
- SSR cookie handling through `@supabase/ssr`
- parent-managed Kid Mode/PIN profile switching
- optional linked child auth profiles for older kids
- parent-created invitations for other parents or caregivers
- parent-created email invitations that connect older kids to existing child
  profiles
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
   - Verify the password recovery email template still uses Supabase's
     generated confirmation link so the app-provided redirect is preserved.
   - For production delivery, configure an approved SMTP provider and review
     the Auth email rate limits. The built-in sender is intended for testing,
     restricts recipients, and is currently limited to two auth emails per
     hour per project.
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
- `/forgot-password`: requests a password recovery email without revealing
  whether an account exists.
- `/reset-password`: accepts a new password only after the recovery link has
  established an authenticated Supabase session.
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
9. Select **Forgot password?**, submit the parent email, and confirm the UI
   always shows the neutral "if an account exists" response.
10. Open the recovery message. For local Supabase, use Mailpit at
    `http://127.0.0.1:55424`. Confirm the link returns through `/callback`, opens
    `/reset-password`, rejects mismatched passwords, updates a matching valid
    password, signs out, and accepts the new password at `/sign-in`.
11. Confirm an expired or already-used link offers a path to request a new
    recovery email.
12. As a parent, add a child, set a Kid Mode PIN in Family settings, unlock the
    child from `/kid-mode`, and confirm parent-only routes redirect away.
13. As a parent, invite another parent or caregiver from Family settings. The
    invited adult must sign in with the invited email address and accept from
    `/family/invite/accept?invite=<id>`.
14. Select **Connect email** on an active child, confirm guardian authority,
    and send an invite to an email that has not previously registered in this
    app. Open the local message in Mailpit, create the child password, and
    confirm the existing child profile opens Calendar without parent-only
    Family navigation.

## Password Recovery Flow

1. `/forgot-password` validates and normalizes the submitted email.
2. The server calls `resetPasswordForEmail()` with
   `/callback?next=/reset-password` as the redirect. The response stays neutral
   for known and unknown addresses to reduce account-enumeration risk.
3. `/callback` exchanges the short-lived PKCE code for the cookie-backed
   recovery session. Invalid or expired recovery callbacks return to
   `/forgot-password` with a retry path.
4. `/reset-password` checks for a verified Supabase session before rendering
   the form. Its server action validates matching passwords and calls
   `updateUser()`.
5. After the password update, the app signs out the recovery session and sends
   the user to `/sign-in`.

No additional redirect URL is needed: the existing allow-listed `/callback`
URL covers password recovery. Recovery codes are short-lived, single-use PKCE
codes and must be opened in the same browser that requested the email.

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

## Child Email Invitations

Parents can connect a separate Supabase Auth account to an existing active
child profile from Family settings. The flow never creates a second child row.

- Pending rows live in `family_child_invitations` and expire after 14 days.
- The invitation uses `auth.admin.inviteUserByEmail`, returns through
  `/callback`, and opens `/family/child-invite/accept`.
- Supabase invite links may return session tokens in a URL fragment rather than
  a PKCE code. `/callback` sends only adult/child invitation destinations to
  `/invite-callback`, which establishes the cookie-backed session in the
  browser and removes the fragment before opening the acceptance form.
- Acceptance requires the exact invited email and a new matching password.
- The server-only atomic function attaches `family_members.profile_id` and
  `family_member_auth_links`; linked children retain existing child RLS rights.
- Revoking a pending invitation leaves the child active. Disconnecting an
  accepted account revokes its family link and clears `profile_id`, but does
  not delete the child, its history, its Kid Mode PIN, or the Auth user.
- Invite emails are scrubbed from invitation rows after acceptance, revocation,
  or expiry. Audit metadata stores IDs, not the email address.
- Automatic invites currently require an email not already registered in this
  app because Supabase rejects admin invitations for confirmed users.
- Built-in Supabase email delivery is testing-only and rate-limited. Configure
  a reviewed SMTP provider before relying on delivery to arbitrary production
  recipients; no provider or paid email service is added by Phase 26.

Without Supabase env vars configured:

- `/sign-in` and `/sign-up` render disabled forms with a setup notice.
- protected routes render setup-required states instead of throwing during local
  development or build.

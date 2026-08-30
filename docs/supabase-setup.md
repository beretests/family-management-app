# Supabase Setup

This app uses Supabase Auth, Postgres, RLS, private Storage, and server-side
maintenance with a Supabase secret key.

## API Keys

Use Supabase's current API key model:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
CHILD_SESSION_SECRET=<long-random-server-secret>
```

Do not use the legacy JWT `service_role` key for production app deployment.
`SUPABASE_SECRET_KEY` is still elevated and bypasses RLS, so keep it server-only
and never expose it in browser code, logs, query strings, screenshots, or docs.

The local Supabase CLI may still output a `SERVICE_ROLE_KEY` for local-only test
automation. Treat that as a local tooling detail, not the production app key.

Kid Mode uses `CHILD_SESSION_SECRET` to sign app cookies and
`SUPABASE_SECRET_KEY` only after server-side parent/session/member validation
for child-mode task writes. Supabase RLS cannot inspect the app's child cookie,
so these writes must stay in server actions and route handlers only.

## Auth

In Supabase Dashboard:

1. Open Authentication settings.
2. Set the local Site URL:

```text
http://localhost:3000
```

3. Add local Redirect URLs:

```text
http://localhost:3000/callback
```

4. Add production Redirect URLs:

```text
https://your-app.vercel.app/callback
https://your-custom-domain.example/callback
```

5. Enable email/password auth.
   - Password recovery uses the existing `/callback` URL and Supabase's
     recovery email template. Keep the generated confirmation link intact if
     the template is customized.
   - Existing child-account connections use the Magic Link template. Keep
     `{{ .ConfirmationURL }}` in that template so the app-provided callback and
     invitation ID are preserved.
   - The built-in email sender is for testing, restricts recipients, and is
     currently limited to two project-wide auth emails per hour. Use a reviewed
     SMTP provider for real-user delivery and configure rate limits appropriate
     for the family app's expected traffic.
6. Configure Google OAuth if Google sign-in is used:
   - Create OAuth credentials in Google Cloud.
   - Add the Supabase callback URL shown in the Google provider screen.
   - Add the Google client ID and secret in Supabase.
   - Add the app origins in Google OAuth settings.
7. Keep phone auth disabled unless SMS provider setup and cost are explicitly
   approved.

Adult family invitations use Supabase Auth invite emails. Keep
`SUPABASE_SECRET_KEY` configured server-side and verify that `/callback` is in
the redirect allow-list for local and production domains. The app sends invite
links back through `/callback?next=/family/invite/accept?...`.

Child email invitations reuse the same callback allow-list and server-only
secret. Their destination is
`/callback?next=/family/child-invite/accept?...`; no additional redirect URL or
environment variable is required.

Phase 30 can return a child connection link directly to an authorized parent by
using `auth.admin.generateLink()` server-side. Confirmed users receive a magic
link; missing or unconfirmed users receive an invite link. These links bypass
SMTP delivery, but they remain short-lived bearer credentials. The app returns
them only in the Server Action response and does not persist or audit the raw
URL. Keep `SUPABASE_SECRET_KEY` server-only and never log generated links.

Password recovery also returns through the allow-listed callback, using
`/callback?next=/reset-password`. No migration, extra redirect allow-list
entry, secret key, or public environment variable is required.

## Local CLI

Install the Supabase CLI using current official instructions, then run:

```bash
supabase start
supabase db reset
```

`supabase db reset` applies all migrations and runs `supabase/seed.sql`.

This repo intentionally uses non-default local ports:

- API: `http://127.0.0.1:55421`
- Database: `postgresql://postgres:postgres@127.0.0.1:55422/postgres`
- Studio: `http://127.0.0.1:55423`
- Email testing: `http://127.0.0.1:55424`
- SMTP: `55425`
- POP3: `55426`
- Analytics: `http://127.0.0.1:55427`
- Shadow database: `55420`

## Remote Migrations

Do not make manual dashboard table edits for app schema. Keep schema changes in
migrations.

For a linked remote project:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Review the migration list before confirming. Do not run destructive migration
steps without explicit approval.

Phase 20 requires
`20260814170000_ics_schedule_import.sql`. It adds nullable import provenance, a
family/UID partial unique index, and the security-invoker
`import_schedule_event` function. It does not add a dashboard setting or
Storage bucket. Apply it before exposing the calendar import panel.

Phase 22 requires
`20260826170000_schedule_occurrence_overrides.sql`. It adds the family-scoped
occurrence override and override-attendee tables, RLS policies, and three
security-invoker functions for atomic single-occurrence replacement, series
splitting, and series truncation. Apply it before exposing the new recurring
event scope controls. No Supabase dashboard setting, Storage bucket, secret, or
paid feature is required.

Phase 23 requires `20260828170000_add_no_school_event_type.sql`. It adds the
`no_school` enum value and check constraints that require No School base events
and modified occurrence overrides to be all day. It changes no RLS policy and
requires no Supabase dashboard setting, Storage bucket, secret, or paid
feature. Apply it before exposing the No School option in event or import
forms.

Phase 24 requires `20260828190000_grocery_shopping_lists.sql`. It adds the
family-scoped catalog, lists, and list items; one-open-list and normalized-name
indexes; explicit grants; and operation-specific RLS. Apply it before exposing
`/groceries`. It requires no dashboard setting, Storage bucket, new secret, or
paid Supabase feature.

Phase 26 requires `20260828210000_child_email_invitations.sql` and
`20260828211000_fix_child_disconnect_actor.sql`. They add parent-scoped child
invitation records, active-link uniqueness, exact-email atomic acceptance, and
parent-only atomic disconnect. Apply them before enabling child email invites.
They require no Storage bucket or dashboard schema edits.

Phase 28 requires `20260828230000_existing_child_account_linking.sql`. It adds
the child-invitation `account_mode`, a service-role-only exact-email Auth
lookup, and acceptance checks that reject any account with active family
access. It also explicitly removes `anon` and `authenticated` execute access
from both server-only functions. Apply it before allowing registered addresses
in the Connect email form. It needs no new secret, Storage bucket, or schema
edit in the dashboard.

Phase 30 adds no migration, RLS policy, Storage bucket, environment variable,
or dashboard setting. It reuses the Phase 26/28 invitation schema, the existing
`/callback` redirect allow-list, `NEXT_PUBLIC_APP_URL`, and the server-only
`SUPABASE_SECRET_KEY`.

## Storage

Phase 8 creates a private `task-evidence` bucket by migration.

Expected bucket behavior:

- public access disabled
- JPEG, PNG, WebP, GIF only
- 5 MB max file size
- signed URL previews only
- evidence cleanup after review/retention

Do not make the `task-evidence` bucket public.

## RLS Review

After migrations, verify:

- RLS is enabled on app tables.
- Family-owned tables include `family_id`.
- Parents can manage family settings, members, templates, tasks, rewards,
  reviews, reminders, and audit records.
- Parents can select and manage `family_invitations`; invited adults are linked
  only after signing in with the invited email and accepting the invite.
- Only parents can read/create/revoke `family_child_invitations`; acceptance is
  server-only, exact-email matched, and connects an existing active child.
- Auth-user lookup and invitation acceptance RPCs are executable only with the
  server-side secret role. Browser callers cannot select `existing_account`
  mode, inspect whether an email is registered, or directly accept a link.
- Existing accounts with any active direct membership or unrevoked member
  link are rejected, including membership in another family.
- Disconnecting a child account revokes its active auth link without deleting
  the child profile, history, Kid Mode credential, or Auth user.
- Parents can select and manage `family_member_pin_credentials`; child accounts
  cannot read PIN hashes.
- Children can read family schedule and their own assignments/submissions.
- Active family members can create and update only their own self-assigned
  schedule events; parents can manage all schedule events.
- Only parents can delete `schedule_events`; recurrence rows cascade when a
  parent deletes the series.
- `schedule_event_recurrences` has RLS enabled and remains family-scoped.
- Occurrence override tables have RLS enabled. Family members can read them;
  parents can manage all overrides; event creators can modify overrides only
  for their own self-assigned series. Cancellation and following-event
  truncation remain parent-only.
- ICS imports use the existing schedule-event, attendee, and recurrence RLS;
  the atomic import function does not broaden those policies.
- Active family members can read the family grocery catalog/lists, create the
  single open list, and contribute items. Only parents can close/delete lists
  or hide/restore catalog items. Column grants prevent contributor updates to
  relationship, attribution, and snapshot columns.
- Children cannot approve submissions or manage parent settings/templates.
- Global starter chore templates are read-only reference data.

The SQL helpers in `tests/sql`, including
`schedule-occurrence-overrides-verification.sql` and
`no-school-verification.sql`, and `grocery-lists-verification.sql` provide
lightweight local verification.
`child-email-invitations-verification.sql` covers Phase 26 linking and
disconnection boundaries. `existing-child-account-link-verification.sql`
covers Phase 28 RPC grants, safe invitation defaults, existing-account
acceptance, and occupied-account rejection.

## Maintenance

The daily Vercel cron route uses `SUPABASE_SECRET_KEY` to:

- generate reminders
- delete expired private evidence objects from Storage
- delete matching `task_evidence_files` metadata
- delete completed or archived grocery lists after their 90-day retention date
  while preserving reusable catalog items

Required values:

```bash
SUPABASE_SECRET_KEY=
CRON_SECRET=
```

The route is:

```text
/api/cron/daily-maintenance
```

It requires:

```text
Authorization: Bearer <CRON_SECRET>
```

## Free-Tier Monitoring

Monitor:

- database size
- Storage size
- egress
- auth activity
- project pause/inactivity status
- Vercel function and cron usage

Evidence uploads and long-lived history are the main growth areas. Keep
retention cleanup enabled before real family use.

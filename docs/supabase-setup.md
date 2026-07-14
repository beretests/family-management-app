# Supabase Setup

This app uses Supabase Auth, Postgres, RLS, private Storage, and server-side
maintenance with a Supabase secret key.

## API Keys

Use Supabase's current API key model:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Do not use the legacy JWT `service_role` key for production app deployment.
`SUPABASE_SECRET_KEY` is still elevated and bypasses RLS, so keep it server-only
and never expose it in browser code, logs, query strings, screenshots, or docs.

The local Supabase CLI may still output a `SERVICE_ROLE_KEY` for local-only test
automation. Treat that as a local tooling detail, not the production app key.

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
6. Configure Google OAuth if Google sign-in is used:
   - Create OAuth credentials in Google Cloud.
   - Add the Supabase callback URL shown in the Google provider screen.
   - Add the Google client ID and secret in Supabase.
   - Add the app origins in Google OAuth settings.
7. Keep phone auth disabled unless SMS provider setup and cost are explicitly
   approved.

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
- Children can read family schedule and their own assignments/submissions.
- Children cannot approve submissions or manage parent settings/templates.
- Global starter chore templates are read-only reference data.

The SQL helper `tests/sql/rls-verification.sql` provides lightweight local
verification.

## Maintenance

The daily Vercel cron route uses `SUPABASE_SECRET_KEY` to:

- generate reminders
- delete expired private evidence objects from Storage
- delete matching `task_evidence_files` metadata

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

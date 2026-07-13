# Supabase Setup

This document covers Supabase setup through Phase 8: Auth, database schema/RLS
policies, family profile setup, assignments, and private evidence storage.

## Phase 2: Auth

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Dashboard setup:

1. Create or open a Supabase project.
2. Configure Authentication Site URL:

```text
http://localhost:3000
```

3. Configure Redirect URLs:

```text
http://localhost:3000/callback
```

4. Enable email/password auth.
5. Configure Google OAuth if Google sign-in should be tested.
6. Keep phone auth disabled unless SMS cost risk is approved.

## Phone Auth Cost Guardrail

Phone auth is disabled by default with:

```bash
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
```

Do not enable it until:

- the owner chooses an SMS provider
- provider credentials are configured in Supabase
- possible SMS costs are accepted
- setup steps are documented here and in `docs/auth-setup.md`

## Phase 3: Database Schema And RLS

Phase 3 adds:

- `supabase/config.toml`
- migrations in `supabase/migrations`
- RLS policies on app tables
- starter chore seed data in `supabase/seed.sql`
- data-model documentation in `docs/data-model.md`

### Local CLI Setup

Install the Supabase CLI using the current official instructions for your
machine, then from the repo root run:

```bash
supabase start
supabase db reset
```

`supabase db reset` applies migrations and runs `supabase/seed.sql` locally.

This repo intentionally uses non-default local ports in `supabase/config.toml`
so it can run alongside other Supabase projects:

- API: `http://127.0.0.1:55421`
- Database: `postgresql://postgres:postgres@127.0.0.1:55422/postgres`
- Studio: `http://127.0.0.1:55423`
- Email testing: `http://127.0.0.1:55424`
- SMTP: `55425`
- POP3: `55426`
- Analytics: `http://127.0.0.1:55427`
- Shadow database: `55420`

Optional verification:

```bash
supabase status
```

Then run the SQL checks in `tests/sql/rls-verification.sql` from a local SQL
editor or `psql`.

### Remote Project Setup

Do not make manual dashboard table edits for app schema. Keep schema changes in
migrations.

When ready to apply to a remote project:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Review the migration before confirming. Do not run destructive migration steps
without explicit approval.

### RLS Review

After applying migrations, verify:

- RLS is enabled on app tables.
- family-owned tables include `family_id`.
- parents can manage family settings, members, templates, tasks, rewards, and
  approvals.
- children can read family schedule and their own assignments/submissions.
- children cannot approve submissions or manage parent settings/templates.
- global starter chore templates are read-only reference data for authenticated
  users.

## Phase 4: Family Bootstrap RLS

Phase 4 adds a small follow-up migration:

- `20260708190000_fix_initial_family_member_bootstrap.sql`

It creates `current_user_created_family_without_members(family_id)` and replaces
the initial parent `family_members` insert policy. This lets an authenticated
user create the first parent membership row for a family they just created,
while keeping later member management parent-only.

Run `supabase db reset` locally after pulling this phase. For a linked remote
project, review the migration and then use:

```bash
supabase db push
```

The SQL verification script now includes a rollback-only bootstrap check for
this policy.

### API Keys

Use:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Do not use `SUPABASE_SECRET_KEY` in browser code. It bypasses RLS and must stay
server-only.

The legacy `SUPABASE_SERVICE_ROLE_KEY` name may remain in docs for compatibility
with older tooling, but new app code should prefer `SUPABASE_SECRET_KEY`.

## Phase 8: Evidence Storage

Phase 8 adds:

- additive `task_instances` snapshot columns for evidence requirements
- private `task-evidence` Storage bucket
- Storage object policies scoped by family, task, and assigned member
- signed URL access pattern for private evidence previews
- evidence retention documentation in `docs/storage-retention.md`

Apply locally with:

```bash
supabase db reset
```

For a linked remote project, review the migration and then use:

```bash
supabase db push
```

The migration creates the bucket as private and limits uploads to:

- JPEG
- PNG
- WebP
- GIF
- 5 MB max file size

Do not make the `task-evidence` bucket public.

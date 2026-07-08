# Supabase Setup

This document starts with the Phase 2 Auth setup. Database schema, migrations,
RLS, storage, seed data, and retention cleanup are planned for later phases.

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

## Later Phases

Phase 3 should add:

- migrations in `supabase/migrations`
- RLS policies
- seed data
- data-model documentation

Phase 8 should add:

- private evidence storage bucket
- storage policies
- signed URL access pattern
- evidence retention documentation

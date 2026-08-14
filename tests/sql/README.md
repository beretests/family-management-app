# SQL Verification

These SQL files are lightweight verification aids for Supabase migrations.

After applying migrations locally, run:

```bash
supabase db reset
```

Then open the local SQL editor or connect with `psql` and run:

```sql
\i tests/sql/rls-verification.sql
\i tests/sql/schedule-permissions-verification.sql
\i tests/sql/ics-import-verification.sql
```

Expected result:

- RLS checks return zero rows.
- family-owned table checks return zero rows.
- starter chore count returns `14`.
- schedule permission verification completes without an exception and rolls back.
- ICS import verification checks atomic writes, duplicate UIDs, self-only child
  assignment, and parent whole-family imports, then rolls back.

These checks do not replace RLS integration tests with authenticated JWTs. They
are a low-cost Phase 3 sanity check until app-level data access exists.

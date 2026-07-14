# Technical Guidance: Family Management App for Kids

This file contains architecture, platform, security, RLS, data-model, testing, documentation, and deployment guidance. Codex must read the relevant sections before implementing technical changes.

---

## Current implementation assumptions

Unless the user says otherwise, assume:

- Framework: Next.js App Router with TypeScript.
- Styling: Tailwind CSS plus accessible component primitives, preferably shadcn/ui or simple custom components.
- Database: Supabase Postgres.
- Auth: Supabase Auth.
- Hosting: Vercel Hobby/free tier.
- Storage: Supabase Storage private bucket for evidence photos.
- Server logic: Prefer Next.js Route Handlers / Server Actions on Vercel for app-facing operations. Use Supabase Edge Functions only for small, idempotent tasks that benefit from Supabase proximity or are clearly easier to run there.
- Scheduling/reminders: Use free-friendly in-app reminders first. Use Vercel Cron only for daily or low-frequency jobs that fit Hobby-plan constraints. Do not add paid messaging services without approval.
- AI/LLM generation: Do not add paid AI APIs by default. Chore generation and workload balancing should be deterministic and rule-based unless the user approves AI costs.

If the repo already contains different choices, inspect the repo first and propose how to align with this guidance without unnecessary churn.

---

## Always check current official docs before implementation

Before implementing platform-sensitive work, check the current official documentation. This is required because Next.js, Supabase, Vercel, and auth APIs change frequently.

Review the relevant docs for the task, including:

- Next.js App Router, Server Components, Client Components, Server Actions, Route Handlers, middleware/proxy behavior, caching, and deployment behavior.
- Supabase Auth with Next.js SSR, Supabase Auth providers, email/password, OTP/magic link, phone auth, RLS, Storage policies, and current API key guidance.
- Supabase pricing/free-tier limits, especially database size, storage size, egress, auth limits, function limits, project pausing, and active project limits.
- Vercel Hobby plan, Vercel Functions, Cron Jobs, environment variables, deployment limits, image optimization, and usage monitoring.
- Current security guidance for handling Supabase secret keys, legacy service-role keys, cookies, redirects, and private file access.

If internet access is unavailable, state that limitation in the plan and avoid making assumptions about platform-specific setup that may have changed.

---

## Free-tier guardrails

The user is on free tiers for Vercel and Supabase. Protect them from accidental costs.

Do not add any paid service unless explicitly approved. This includes SMS providers, email providers beyond free limits, paid storage, paid AI APIs, paid analytics, paid cron/workers, paid queues, and paid observability.

Important phone-auth rule:

- Supabase phone auth requires a supported SMS provider such as Twilio, MessageBird, Vonage, or another configured provider.
- Implement phone auth as feature-flagged and disabled by default unless the user has configured a provider.
- Document provider setup and possible cost risk in `docs/supabase-setup.md` and `docs/auth-setup.md`.
- Email auth and OAuth/provider auth should be the default low-cost paths.

Evidence photo storage rules:

- Use a private Supabase Storage bucket.
- Never store evidence photos in a public bucket.
- Compress/resize photos client-side before upload where practical.
- Enforce a conservative app-level max file size, such as 2-5 MB per image unless changed by the user.
- Store only what is necessary for parent review.
- Add a retention policy, such as deleting approved/rejected evidence after 30 days by default.
- Provide a daily cleanup job using Vercel Cron or a Supabase scheduled job only after documenting the setup.
- Track storage usage concerns in docs so a new developer understands why rotation exists.

---

## Auth requirements

Implement Supabase Auth with:

- OAuth/provider auth, starting with Google unless the user specifies another provider.
- Email auth, preferably email/password and/or magic link depending on user preference.
- Phone auth as optional, feature-flagged, and documented because it requires an SMS provider.

Auth implementation requirements:

- Use the current Supabase SSR approach for Next.js.
- Store sessions securely using server-compatible cookies where appropriate.
- Validate redirects and callback URLs.
- Add `docs/auth-setup.md` with dashboard setup steps for each enabled provider.
- Add `.env.example` with required public variables and server-only variables clearly marked.
- Never put secret keys in client components.
- Use RLS for family data access.
- Add tests or manual verification steps for sign-up, sign-in, sign-out, and protected route access.

Recommended environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
CRON_SECRET=
```

Only use `SUPABASE_SECRET_KEY` server-side for carefully reviewed admin operations, cleanup jobs, or child-mode route handlers that cannot rely on a user JWT. Prefer user-scoped Supabase clients and RLS wherever possible. Do not use Supabase's legacy `service_role` key for production app deployment unless a documented tool limitation requires it.

---

## Recommended database tables

Use Supabase migrations in `supabase/migrations`.

Recommended tables:

- `profiles`
- `families`
- `family_members`
- `family_member_auth_links`
- `family_member_preferences`
- `family_member_statuses`
- `house_profiles`
- `rooms`
- `chore_templates`
- `chore_template_subtasks`
- `task_instances`
- `task_instance_subtasks`
- `task_submissions`
- `task_evidence_files`
- `task_reviews`
- `schedule_events`
- `swap_requests`
- `reward_catalog`
- `reward_redemptions`
- `points_ledger`
- `leaderboard_snapshots`
- `reminders`
- `audit_events`
- `app_settings`

Design rules:

- Every family-owned table must include `family_id` unless there is a strong reason not to.
- Use UUID primary keys unless a stable alternative is already used.
- Include `created_at` and `updated_at` timestamps.
- Use soft-delete fields where history matters.
- Keep point changes in `points_ledger`; do not rely only on mutable totals.
- Store denormalized snapshots on task instances so history remains understandable when templates change.
- Add indexes for `family_id`, `assigned_to_member_id`, `due_at`, `status`, and date-range schedule queries.

---

## RLS and security requirements

Enable RLS on all family-owned tables.

RLS must enforce:

- Authenticated family members can read family data for families they belong to.
- Parents can manage family settings, children, chore templates, task instances, rewards, and approvals.
- Children can read family schedule and their own assignments.
- Children can submit their own task completion and evidence where allowed.
- Children cannot approve their own submissions.
- Children cannot edit task templates or parent settings.
- Evidence files are private and scoped to family/task access.

Security rules:

- Never expose Supabase secret or admin keys in client code.
- Validate all server actions and route handlers with Zod or equivalent schema validation.
- Treat `family_id`, `member_id`, and `role` from the client as untrusted.
- Resolve permissions server-side from the authenticated user/session.
- Use signed URLs for private evidence file previews.
- Add audit events for parent approvals, rejections, task reassignment, swaps, reward redemption, and destructive operations.

---

## Recommended project structure

If starting a new app, use this structure unless there is a strong reason not to:

```text
app/
  (auth)/
    sign-in/
    sign-up/
    callback/
  (app)/
    dashboard/
    schedule/
    chores/
    approvals/
    rewards/
    leaderboard/
    settings/
  api/
    cron/
      cleanup-evidence/
      daily-reminders/
    child-session/
    evidence/
components/
  ui/
  layout/
  family/
  schedule/
  chores/
  rewards/
features/
  auth/
  family/
  schedule/
  chores/
  rewards/
  reminders/
  leaderboard/
lib/
  supabase/
  auth/
  permissions/
  validation/
  dates/
  points/
  chore-engine/
  storage/
supabase/
  migrations/
  seed.sql
  functions/
docs/
  architecture.md
  local-dev.md
  supabase-setup.md
  vercel-setup.md
  auth-setup.md
  storage-retention.md
  data-model.md
  product-decisions.md
tests/
  unit/
  integration/
  e2e/
```

Keep feature-specific business logic out of page components. Use `features/*` and `lib/*` for reusable logic.

---

## Code quality standards

Use:

- TypeScript strict mode.
- ESLint.
- Prettier or a documented formatting setup.
- Zod or equivalent for runtime validation.
- Server-side permission helpers.
- Clear domain types.
- Small, composable React components.
- Loading/error/empty states.
- Unit tests for non-trivial logic.
- Integration tests for permissions/RLS where practical.
- E2E smoke tests for core parent and kid flows if Playwright is available.

Avoid:

- Large page components with mixed UI, data access, and business rules.
- Duplicate permission checks scattered across files.
- Hard-coded family IDs, user IDs, or magic values.
- Client-side-only security.
- Unreviewed dependencies.
- Paid SDKs/services without approval.

---

## Testing requirements

At minimum, add or maintain scripts similar to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Before finishing any implementation, run the relevant available checks:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

If a script does not exist, propose adding it. If a check cannot run, explain why and provide the closest manual verification.

Critical tests to add early:

- Chore assignment fairness scoring.
- Age/ability filtering.
- Schedule conflict detection.
- Sick/rest-day assignment reduction.
- Dependency enforcement.
- Rejection/resubmission point calculation.
- Swap eligibility.
- Reward redemption point deduction.
- Evidence cleanup selection.
- Parent vs child permissions.

---

## Documentation requirements

Every feature that requires Supabase or Vercel configuration must update docs in the same PR.

Required docs:

- `docs/local-dev.md`: install, env vars, Supabase local/remote setup, run commands, seed data.
- `docs/supabase-setup.md`: project creation, database migrations, RLS, auth providers, storage bucket, policies, scheduled jobs, secrets.
- `docs/vercel-setup.md`: project import, env vars, deployment settings, cron setup, usage monitoring, free-tier cautions.
- `docs/auth-setup.md`: email, OAuth/provider auth, optional phone auth, redirect URLs, callback routes, troubleshooting.
- `docs/storage-retention.md`: evidence upload rules, compression, private bucket, signed URLs, cleanup job, retention period.
- `docs/data-model.md`: table relationships, role model, key policies, points ledger.
- `docs/product-decisions.md`: product rules, scoring rules, age guidance, reward guidance, fairness assumptions.
- `docs/architecture.md`: high-level app architecture and request/data flow.

Docs must be written so a new developer can onboard quickly.

---

## Supabase setup must be documented

Whenever the implementation requires a Supabase dashboard action, document it.

Examples:

- Create project.
- Configure Site URL and Redirect URLs.
- Enable email auth.
- Enable Google or other OAuth provider.
- Configure phone auth provider if enabled.
- Create private `task-evidence` storage bucket.
- Add storage policies.
- Apply database migrations.
- Seed starter chore templates.
- Set secrets for Edge Functions if used.
- Configure Cron if using Supabase Cron.
- Generate TypeScript types if used.

---

## Vercel setup must be documented

Whenever the implementation requires a Vercel dashboard action, document it.

Examples:

- Import GitHub repo into Vercel.
- Select framework preset.
- Add environment variables.
- Configure production domain and `NEXT_PUBLIC_APP_URL`.
- Add Supabase callback URLs.
- Configure `CRON_SECRET`.
- Add `vercel.json` cron entries if used.
- Check usage dashboard to stay within free limits.
- Confirm build command and output settings.

---

## Edge/server function guidance

Prefer the simplest free option.

Use Next.js Route Handlers / Vercel Functions for:

- Chore generation endpoint.
- Task submission/review endpoints where server logic is required.
- Evidence signed URL endpoints.
- Daily cleanup cron endpoint.
- Daily reminder generation endpoint.

Use Supabase Edge Functions only when:

- A task benefits from being close to Supabase.
- A webhook should be handled outside Vercel.
- A function needs Supabase secrets and Deno runtime is acceptable.
- The function is short-lived, idempotent, documented, and within free-tier constraints.

Do not add queues, long-running workers, or paid background job systems without approval.

---

## Commit message recommendations

After completing changes, recommend one or more commit messages. Use Conventional Commits.

Examples:

- `chore: add AGENTS guidance for family app development`
- `feat(auth): add Supabase email and provider sign-in`
- `feat(family): add parent-managed child profiles`
- `feat(chores): add rule-based chore generation engine`
- `feat(schedule): add family week view`
- `feat(storage): add private evidence upload flow`
- `docs: add Supabase and Vercel setup guide`
- `test(chores): cover fairness assignment rules`
- `fix(auth): protect parent-only routes`

---

## Definition of done

A task is done only when:

- The implementation matches the approved plan or deviations are explained.
- TypeScript types are clean.
- Lint/build/tests pass or failures are clearly documented.
- Parent/child permission boundaries are enforced server-side and in RLS where applicable.
- Supabase/Vercel setup docs are updated.
- Free-tier cost risks are documented.
- New developer onboarding docs remain accurate.
- No secrets are committed.
- UI includes loading, empty, and error states.
- Accessibility basics are respected.
- Recommended commit message(s) are provided.

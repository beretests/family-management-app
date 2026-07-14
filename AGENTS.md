# AGENTS.md

## Project: Family Management App for Kids

This repository is for a **Next.js App Router** family management app hosted on **Vercel** and backed by **Supabase** for database, auth, storage, and optional edge/server functions.

The app should help parents and kids manage chores, rewards, evidence, schedules, extracurriculars, sick/rest status, and workload fairness. It must be fun, private, low-cost, mobile-first, and easy for a new developer to understand.

Target scenario:

> A parent has 3 kids, ages 8, 11, and 14. The 8-year-old hates cleaning bathrooms, the 14-year-old has soccer on Tuesdays and Thursdays, and chores should be distributed fairly every day while considering schedules, age, ability, illness, disliked chores, and completion history.

---

## Required project docs

Before implementing, read this file first, then read the relevant supporting docs:

- `CODEX_IMPLEMENTATION_GUIDE.md`: phased build plan and Codex prompts.
- `docs/WORKTREE_PHASE_WORKFLOW.md`: detailed Git worktree workflow, branch names, merge gates, and cleanup.
- `docs/PRODUCT_SPEC.md`: product behavior, UX, family schedule, chores, fairness, rewards, reminders, and starter chore library.
- `docs/TECHNICAL_GUIDE.md`: architecture, Supabase, Vercel, auth, RLS, storage, data model, tests, docs, and definition of done.
- `docs/PHASE_HANDOFF.md`: current state and handoff notes. Create it after the first implementation phase if it does not exist.

If a referenced doc does not exist yet, create it only when it is in the approved phase scope.

---

## Non-negotiable Codex workflow

Before making code changes for a new phase, produce an implementation plan and wait for explicit approval.

The plan must include:

1. Phase goal and scope.
2. Branch and worktree path.
3. Files likely to be created, edited, or deleted.
4. Database migrations and RLS policies likely to be added or changed.
5. Supabase dashboard steps required.
6. Vercel dashboard steps required.
7. Environment variables required.
8. Free-tier or cost risks.
9. Test and verification plan.
10. Risks, assumptions, and open questions.

After approval, implement only the approved phase. Do not ask for routine technical choices; use the defaults in this file and document decisions in `docs/DECISIONS.md` when needed.

Stop and ask before:

- destructive database migrations
- deleting user data
- broadening RLS or security access
- changing auth/session architecture
- adding paid services or paid dependencies
- enabling SMS/phone auth with a provider that may charge money
- adding secrets or requesting secret values
- deploying to production
- making large architectural changes outside the approved phase

After implementation, provide:

1. Summary of changes.
2. Changed files.
3. Commands run and results.
4. Supabase/Vercel manual setup still required.
5. Known limitations and follow-up work.
6. Recommended Conventional Commit message.
7. Merge and worktree cleanup guidance.

Never make broad rewrites, structural moves, dependency swaps, or paid-service integrations without proposing them first.

---

## Git worktree phase workflow

Use Git worktrees for faster and safer Codex development.

Default rule:

> One approved phase = one branch = one isolated worktree = one Codex session.

Do not implement approved phases directly in the main working tree unless the owner explicitly asks for it.

Read `docs/WORKTREE_PHASE_WORKFLOW.md` before creating, merging, or cleaning up worktrees.

### Branch names

Use these branch names unless the approved plan states otherwise:

```bash
phase/00-repo-instructions
phase/01-bootstrap-foundation
phase/02-auth
phase/03-db-rls
phase/04-family-profiles
phase/05-schedule
phase/06-chore-templates
phase/07-assignment-engine
phase/08-kid-submissions
phase/09-parent-review-points
phase/10-rewards-leaderboard
phase/11-reminders-cleanup
phase/12-deployment-polish
```

### Worktree start

From the main repo folder, use the latest approved base, normally `main`:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git worktree add ../family-app-phase-02-auth -b phase/02-auth main
cd ../family-app-phase-02-auth
```

Use the phase-specific branch and folder name. If the repo name is different, use `../<repo-name>-<branch-slug>`.

### Worktree rules

- Keep one phase per branch.
- Keep one Codex session per phase worktree where practical.
- Do not work on the same branch from two worktrees.
- Do not mix unrelated fixes into a phase branch.
- Do not run parallel branches for database migrations, RLS, auth/session architecture, storage policies, deployment config, or dependency upgrades unless explicitly approved.
- Parallel worktrees are acceptable for isolated docs, tests, copy, or UI polish after core auth/RLS/schema decisions are stable.

### Review, merge, and cleanup

Before recommending merge, run available checks from inside the phase worktree:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a script does not exist, report it; do not claim it passed.

Recommended review commands:

```bash
git status --short
git diff --stat main...HEAD
git diff main...HEAD
```

Do not merge until the owner approves the completed phase.

After approved merge and verification on `main`, cleanup may use:

```bash
git worktree remove ../family-app-phase-02-auth
git branch -d phase/02-auth
git worktree prune
```

Never force-remove a worktree or branch without approval and a clear explanation of what would be lost.

At the end of each phase, create or update `docs/PHASE_HANDOFF.md` with: current phase, branch, worktree path, implemented features, manual setup still required, known issues, next recommended phase, and checks that passed or failed.

---

## Current implementation assumptions

Unless the owner says otherwise, assume:

- Framework: Next.js App Router with TypeScript.
- Styling: Tailwind CSS plus accessible component primitives, preferably shadcn/ui or simple custom components.
- Database: Supabase Postgres.
- Auth: Supabase Auth.
- Hosting: Vercel Hobby/free tier.
- Storage: Supabase Storage private bucket for evidence photos.
- Server logic: Prefer Next.js Route Handlers / Server Actions on Vercel for app-facing operations.
- Supabase Edge Functions: Use only for small, idempotent tasks that clearly benefit from Supabase proximity or are easier to run there.
- Reminders: Use free-friendly in-app reminders first. Use Vercel Cron only for daily or low-frequency jobs that fit Hobby/free-tier limits.
- AI/LLM generation: Do not add paid AI APIs by default. Chore generation and workload balancing should be deterministic and rule-based unless the owner approves AI costs.

If the repo already contains different choices, inspect the repo first and propose how to align without unnecessary churn.

---

## Always check current official docs before implementation

Before platform-sensitive work, review the current official docs for the task:

- Next.js App Router, Server Components, Client Components, Server Actions, Route Handlers, middleware/proxy behavior, caching, and deployment behavior.
- Supabase Auth with Next.js SSR, auth providers, email/password, OTP/magic link, phone auth, RLS, Storage policies, and current API key guidance.
- Supabase pricing/free-tier limits: database size, storage size, egress, auth limits, functions, project pausing, and active project limits.
- Vercel Hobby plan, Functions, Cron Jobs, environment variables, deployment limits, image optimization, and usage monitoring.
- Current security guidance for Supabase secret keys, legacy service-role keys, cookies, redirects, and private file access.

If internet access is unavailable, state that limitation in the plan and avoid making unverifiable platform assumptions.

---

## Free-tier and cost guardrails

The owner is on free tiers for Vercel and Supabase. Protect against accidental costs.

Do not add paid services unless explicitly approved. This includes SMS providers, paid email, paid storage, paid AI APIs, paid analytics, paid cron/workers, paid queues, paid observability, and paid messaging.

Phone auth rule:

- Email auth and OAuth/provider auth are the default low-cost paths.
- Supabase phone auth must be feature-flagged and disabled by default.
- Do not enable phone auth unless the owner confirms an SMS provider and accepts possible cost.
- Document phone provider setup and cost risk in `docs/supabase-setup.md` and `docs/auth-setup.md`.

Evidence photo rules:

- Use a private Supabase Storage bucket.
- Never store evidence photos in a public bucket.
- Compress/resize photos client-side where practical.
- Enforce an app-level max file size, normally 2-5 MB per image.
- Store evidence only as long as needed for parent review.
- Default retention target: delete approved/rejected evidence after 30 days unless the owner changes it.
- Document cleanup setup before enabling scheduled cleanup.

---

## Product principles

The app should feel like a helpful family assistant, not a punishment system.

Prioritize fairness, encouragement, simple kid-friendly language, clear parent controls, mobile-first layouts, visual schedules, transparent assignment reasons, age-appropriate chores, child privacy, and respect for sickness, fatigue, school, extracurriculars, and family realities.

Avoid public leaderboards, shaming language, punitive dark patterns, raw-points-only competition, storing child photos longer than needed, and unnecessary behavioral tracking.

Read `docs/PRODUCT_SPEC.md` before implementing product behavior.

---

## Core role and auth rules

Recommended roles:

- `parent`: Can create/edit/delete family, kids, task templates, chores, schedules, rewards, approvals, and settings.
- `caregiver`: Optional future role with limited admin rights.
- `child`: Can view family schedule, assigned chores, own points/rewards, submit completion, upload evidence when allowed, request swaps, add/edit own extracurricular schedule entries, and mark/request under-the-weather status when enabled.

Rules:

- Only parents can create/edit/delete chore templates and generated chores.
- Only parents can approve/reject submissions.
- Parents can add/remove/deactivate kids.
- Kids and parents can add extracurricular schedule entries; parents can edit all family entries.
- Kids can request swaps; MVP swaps require parent approval.
- Removing a kid should deactivate/soft-delete their profile rather than hard-delete history unless explicitly requested.

Auth requirements:

- Parent/caregiver accounts use Supabase Auth.
- Implement provider auth, starting with Google unless the owner chooses another provider.
- Implement email auth by default.
- Implement phone auth only as optional, disabled-by-default, and documented.
- Younger kids may use a parent-managed Kid Mode/PIN profile switcher; PINs must be hashed and must not be treated as full account security.
- Older kids may later be invited to create their own Supabase Auth account linked to a family member profile.
- Never expose Supabase secret or admin keys in the browser.
- Use RLS and server-side permission checks for family data access.

Recommended environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
CRON_SECRET=
```

Use `SUPABASE_SECRET_KEY` only server-side for carefully reviewed admin operations, cleanup jobs, or child-mode route handlers that cannot rely on a user JWT. Prefer user-scoped Supabase clients and RLS wherever possible. Do not use Supabase's legacy `service_role` key for production app deployment unless a documented tool limitation requires it.

---

## Product scope summary

The app should support:

- Parent dashboard: today’s chores, pending approvals, sick/rest flags, schedule conflicts, workload balance, reminders.
- Kid “My Today” page: chore cards, due times, points, subtasks, notes, checklist, evidence upload when required, and friendly completion states.
- Family schedule: day/week/month views with family member avatars, color coding, filters, and conflict indicators.
- Chore templates: room-based, yard/garden/car/grocery support, subtasks, dependencies, frequency, difficulty, points, age guidance, and parent override.
- Chore generation: based on house profile, number/type of rooms, frequency, due windows, dependencies, and family settings.
- Fair assignment engine: considers age, ability, schedule, sick/rest status, disliked chores, undesirable chore rotation, workload history, completion history, dependencies, and parent overrides.
- Review flow: submission, evidence, parent approve/reject, supportive feedback, resubmission windows, reduced redeemable points after rejection.
- Swaps: child requests, sibling accepts/declines, parent approves in MVP, fairness impact recorded.
- Rewards: non-monetary default catalog, point costs, parent approval for redemption.
- Leaderboard: family-private, age-aware, constructive, not raw-points-only.
- Reminders: free-first in-app reminders, browser notifications where practical, daily cron only when documented and free-tier-compatible.
- History and insights: completion history, imbalances, repeated non-completion, chores frequently rejected, suggested age-appropriate new responsibilities.

Detailed product rules and starter chore templates live in `docs/PRODUCT_SPEC.md`.

---

## Technical implementation summary

Use Supabase migrations in `supabase/migrations` and document dashboard steps in repo docs.

Recommended core tables include:

- `profiles`, `families`, `family_members`, `family_member_auth_links`, `family_member_preferences`, `family_member_statuses`
- `house_profiles`, `rooms`, `chore_templates`, `chore_template_subtasks`
- `task_instances`, `task_instance_subtasks`, `task_submissions`, `task_evidence_files`, `task_reviews`
- `schedule_events`, `swap_requests`, `reward_catalog`, `reward_redemptions`, `points_ledger`, `leaderboard_snapshots`, `reminders`, `audit_events`, `app_settings`

RLS/security requirements:

- Enable RLS on all family-owned tables.
- Every family-owned table should include `family_id` unless there is a strong reason not to.
- Authenticated family members can read family data only for families they belong to.
- Parents can manage family settings, children, chore templates, task instances, rewards, and approvals.
- Children can read family schedule and their own assignments, and submit their own completion/evidence when allowed.
- Children cannot approve their own submissions, edit parent settings, or edit task templates.
- Evidence files are private and scoped to family/task access.
- Treat client-provided `family_id`, `member_id`, and `role` as untrusted.
- Resolve permissions server-side from the authenticated user/session.
- Validate server actions and route handlers with Zod or equivalent.
- Add audit events for approvals, rejections, reassignment, swaps, reward redemption, and destructive operations.

Read `docs/TECHNICAL_GUIDE.md` before implementing schema, RLS, auth, storage, cron, deployment, or architecture.

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
  decisions.md
  phase-handoff.md
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
- Prettier or a documented formatter.
- Zod or equivalent runtime validation.
- Server-side permission helpers.
- Clear domain types.
- Small composable React components.
- Loading, error, and empty states.
- Unit tests for non-trivial logic.
- Integration tests for permissions/RLS where practical.
- E2E smoke tests for core parent and kid flows if Playwright is available.

Avoid large page components with mixed UI, data access, and business rules. Avoid duplicate permission logic.

---

## Documentation requirements

Whenever implementation requires external dashboard or manual setup, document it in the repo.

Required docs as features are added:

- `docs/local-dev.md`
- `docs/architecture.md`
- `docs/supabase-setup.md`
- `docs/vercel-setup.md`
- `docs/auth-setup.md`
- `docs/storage-retention.md`
- `docs/data-model.md`
- `docs/decisions.md`
- `docs/phase-handoff.md`

Docs must be written so a new developer can clone the repo, understand the app, configure Supabase/Vercel, run locally, run migrations, seed data, and deploy safely.

---

## Commit message recommendations

Recommend Conventional Commits, for example:

```bash
chore: bootstrap Next.js family app foundation
feat(auth): add Supabase email and provider authentication
feat(db): add family chore schema and RLS policies
feat(family): add parent-managed child profiles
feat(schedule): add family day and week views
feat(chores): generate chore templates from house profile
feat(chores): add rule-based fair assignment engine
feat(tasks): add kid checklist submissions and evidence upload
feat(points): add parent reviews and points ledger
feat(rewards): add non-monetary rewards and family leaderboard
feat(reminders): add daily reminders and evidence cleanup
docs: add Vercel and Supabase deployment guide
```

Always recommend a commit message after finishing a phase.

---

## Definition of done

A phase is done only when:

- It stays within approved scope.
- It is implemented in the approved branch/worktree.
- Code is readable, typed, and organized.
- Permissions are enforced server-side and with RLS where applicable.
- Free-tier risks are documented.
- Supabase and Vercel setup steps are documented.
- Relevant tests/checks run, or missing checks are reported honestly.
- The app still builds, unless there is a clearly stated blocker.
- `docs/PHASE_HANDOFF.md` is updated.
- A concise summary and recommended commit message are provided.

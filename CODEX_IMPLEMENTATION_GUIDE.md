# Codex Implementation Guide: Family Management App for Kids

This guide is for quickly building the family management app with Codex while staying on free tiers for Vercel and Supabase.

Use this together with `AGENTS.md` in the repo root.

---

## Recommended build strategy

Build the app in small, reviewable phases. Do not ask Codex to build everything at once.

The fastest low-risk path is:

1. Bootstrap the app and repo standards.
2. Add Supabase Auth and protected layout.
3. Add Supabase schema, RLS, seed data, and local docs.
4. Add family and child profile management.
5. Add family schedule at-a-glance.
6. Add chore templates and house-based generation.
7. Add fair assignment engine.
8. Add kid task view, checklist completion, and submissions.
9. Add parent review, rejection, and points ledger.
10. Add rewards and leaderboard.
11. Add reminders and evidence-photo cleanup.
12. Polish UX, docs, tests, and deployment.

Keep every Codex task narrow enough to review.


## Git worktree workflow for every phase

Use this pattern for faster development with less branch confusion:

> One approved phase = one branch = one isolated worktree = one Codex session.

This lets Codex work on a phase without disturbing `main` or any other active phase.

### Standard phase lifecycle

From the main repo folder:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git worktree add ../family-app-phase-02-auth -b phase/02-auth main
cd ../family-app-phase-02-auth
```

Then start or attach Codex in the new worktree folder and give it the approved phase prompt.

When Codex finishes the phase, review from inside the phase worktree:

```bash
git status --short
git diff --stat main...HEAD
git diff main...HEAD
npm run lint
npm run typecheck
npm test
npm run build
```

Commit only after review:

```bash
git add .
git commit -m "feat(auth): add Supabase email and provider authentication"
```

Merge only after you approve the completed phase:

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff phase/02-auth
git push origin main
```

Then clean up:

```bash
git worktree remove ../family-app-phase-02-auth
git branch -d phase/02-auth
git worktree prune
```

Use GitHub pull requests instead of local merges if you prefer. In that case, push the phase branch and let the PR be the merge gate.

### Branch naming

Use these branch names unless there is a good reason to rename them:

| Phase | Branch | Worktree folder |
|---|---|---|
| 0 | `phase/00-repo-instructions` | `../family-app-phase-00-repo-instructions` |
| 1 | `phase/01-bootstrap-foundation` | `../family-app-phase-01-bootstrap-foundation` |
| 2 | `phase/02-auth` | `../family-app-phase-02-auth` |
| 3 | `phase/03-db-rls` | `../family-app-phase-03-db-rls` |
| 4 | `phase/04-family-profiles` | `../family-app-phase-04-family-profiles` |
| 5 | `phase/05-schedule` | `../family-app-phase-05-schedule` |
| 6 | `phase/06-chore-templates` | `../family-app-phase-06-chore-templates` |
| 7 | `phase/07-assignment-engine` | `../family-app-phase-07-assignment-engine` |
| 8 | `phase/08-kid-submissions` | `../family-app-phase-08-kid-submissions` |
| 9 | `phase/09-parent-review-points` | `../family-app-phase-09-parent-review-points` |
| 10 | `phase/10-rewards-leaderboard` | `../family-app-phase-10-rewards-leaderboard` |
| 11 | `phase/11-reminders-cleanup` | `../family-app-phase-11-reminders-cleanup` |
| 12 | `phase/12-deployment-polish` | `../family-app-phase-12-deployment-polish` |

### Parallel worktree rules

Parallel worktrees can speed up development, but use them carefully.

Good candidates for parallel work:

- docs updates
- isolated UI components
- tests for already-merged code
- copy/UX polish
- small non-overlapping fixes

Do not run parallel Codex sessions for:

- database migrations
- RLS policies
- auth/session architecture
- storage policies
- deployment configuration
- dependency upgrades
- shared layout/navigation refactors

For this app, prefer sequential phases until auth, RLS, and the core schema are stable. After Phase 5, parallel work becomes safer.

### Phase prompt wrapper

Add this wrapper to the start of each phase prompt:

```text
Use the Git worktree phase workflow from AGENTS.md.
This phase must be implemented on branch [BRANCH_NAME] in worktree [WORKTREE_PATH].
Do not implement directly on main.
Do not mix other phases into this branch.
At completion, update docs/PHASE_HANDOFF.md, run available checks, and recommend a commit message.
```

---

## Phase 0: Add repo instructions

Add `AGENTS.md` to the repo root.

Recommended commit message:

```bash
chore: add Codex guidance for family app development
```

---

## Phase 1: Bootstrap app foundation

Ask Codex:

```text
Read AGENTS.md and inspect the repo. Do not make changes yet.
Plan this phase using the Git worktree phase workflow: branch `phase/01-bootstrap-foundation`, worktree `../family-app-phase-01-bootstrap-foundation`.
Create a plan to bootstrap this as a Next.js App Router TypeScript app for a family schedule and chores product using Supabase and Vercel free-tier constraints.
The plan must include project structure, dependencies, scripts, docs to create, and tests to add.
Wait for my approval before making changes.
```

After approval, ask:

```text
Implement the approved bootstrap plan. Keep changes minimal and easy for a new developer to understand.
Add or update README, docs/local-dev.md, .env.example, package scripts, and base app layout.
Run lint/typecheck/build if available and recommend commit messages after.
```

Suggested scope:

- Next.js App Router.
- TypeScript strict mode.
- Tailwind.
- Basic app shell.
- README.
- `.env.example`.
- `docs/local-dev.md`.
- `docs/architecture.md`.
- Scripts: lint, typecheck, build, test.

Recommended commit message:

```bash
chore: bootstrap Next.js family app foundation
```

---

## Phase 2: Supabase Auth

Default auth should support parent/caregiver accounts first.

Ask Codex:

```text
Read AGENTS.md and current Supabase Next.js Auth docs.
Do not make changes yet.
Plan Supabase Auth for this app using provider auth, email auth, and optional feature-flagged phone auth.
Phone auth must be disabled by default and documented because it requires an SMS provider.
Include route structure, Supabase client utilities, env vars, protected route strategy, RLS assumptions, and docs updates.
Wait for approval.
```

After approval:

```text
Implement the approved Supabase Auth plan.
Add sign-in/sign-up/sign-out, auth callback, protected app layout, Supabase browser/server clients, and docs/auth-setup.md.
Add NEXT_PUBLIC_ENABLE_PHONE_AUTH=false and document how to enable phone auth only after configuring a provider.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(auth): add Supabase email and provider authentication
```

---

## Phase 3: Database schema and RLS

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan the Supabase schema and RLS for families, profiles, family members, house profiles, chore templates, task instances, schedule events, submissions, rewards, points ledger, reminders, and audit events.
Include migrations, seed data, policy strategy, indexes, and docs updates.
Wait for approval.
```

After approval:

```text
Implement the approved Supabase schema plan using migrations in supabase/migrations.
Add starter seed data for the chore templates listed in AGENTS.md.
Update docs/supabase-setup.md and docs/data-model.md.
Add tests or SQL verification notes where practical.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(db): add family chore schema and RLS policies
```

---

## Phase 4: Family and child profile management

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan parent-managed family and child profile management.
MVP should allow a parent to create a family, add/remove/deactivate kids, set age/ability/preferences, and mark sick/under-the-weather status.
Only parents can manage kids.
Wait for approval.
```

After approval:

```text
Implement the approved family and child profile management plan.
Add parent UI, server-side permission checks, validation, loading/error/empty states, and docs updates.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(family): add parent-managed child profiles
```

---

## Phase 5: Family schedule at a glance

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan the family schedule feature with day/week views, member lanes, color/avatar indicators, chores, extracurriculars, sick/rest entries, and conflict warnings.
Kids and parents can add extracurricular schedule entries, but parents can edit all entries.
Wait for approval.
```

After approval:

```text
Implement the approved family schedule plan.
Add schedule event CRUD with role-aware permissions, day/week UI, filters, and docs updates.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(schedule): add family day and week views
```

---

## Phase 6: Chore templates and house-based generation

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan chore template management and house-based chore generation.
Parents should configure rooms/home features and generate editable chore templates using the starter tasks in AGENTS.md.
Only parents can create/edit/delete templates.
Wait for approval.
```

After approval:

```text
Implement the approved chore template and house-generation plan.
Use deterministic rules, not paid AI.
Add parent review/edit UI before generated templates become active.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(chores): generate chore templates from house profile
```

---

## Phase 7: Fair assignment engine

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan a deterministic chore assignment engine.
It must consider age, ability, schedule, sick/rest status, difficulty, points, disliked chores, undesirable chore rotation, recent workload, completion history, dependencies, and parent overrides.
It must store a human-readable assignment reason.
Wait for approval.
```

After approval:

```text
Implement the approved chore assignment engine with unit tests for fairness, age filtering, schedule conflicts, sick/rest reductions, undesirable rotation, and dependencies.
Add a parent preview screen before assignments are finalized.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(chores): add rule-based fair assignment engine
```

---

## Phase 8: Kid task experience and submissions

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan the kid task experience: My Today, chore cards, subtasks, checklist completion, status changes, notes, optional evidence upload, and friendly completion celebration.
Include privacy/storage handling for evidence photos.
Wait for approval.
```

After approval:

```text
Implement the approved kid task submission plan.
Use a private Supabase Storage bucket for evidence metadata and signed URLs.
Add docs/storage-retention.md and update docs/supabase-setup.md.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(tasks): add kid checklist submissions and evidence upload
```

---

## Phase 9: Parent review, rejection, and points ledger

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan parent review for submitted chores, including approve/reject, kind rejection feedback, reduced redeemable points on resubmission, and points ledger entries.
Only parents can approve or reject.
Wait for approval.
```

After approval:

```text
Implement the approved review and points plan.
Add tests for points calculations and permission boundaries.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(points): add parent reviews and points ledger
```

---

## Phase 10: Rewards and leaderboard

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Plan non-monetary rewards, reward redemption approvals, and a family-private, age-aware leaderboard that considers completion, timeliness, improvement, difficulty, helpfulness, and streaks.
Avoid shaming and avoid raw-points-only ranking.
Wait for approval.
```

After approval:

```text
Implement the approved rewards and leaderboard plan.
Add default non-monetary reward suggestions, redemption flow, and leaderboard UI.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(rewards): add non-monetary rewards and family leaderboard
```

---

## Phase 11: Reminders and cleanup jobs

Ask Codex:

```text
Read AGENTS.md and current Vercel Cron/Supabase scheduling docs.
Do not make changes yet.
Plan free-tier-friendly reminders and evidence cleanup.
Use in-app reminders first, browser notifications where practical, and a daily cron job only if it fits Vercel Hobby limits.
No SMS reminders by default.
Wait for approval.
```

After approval:

```text
Implement the approved reminders and cleanup plan.
Add a secured cron route with CRON_SECRET, update vercel.json if needed, document Vercel setup, and add tests for cleanup selection logic.
Run checks and recommend commit messages.
```

Recommended commit message:

```bash
feat(reminders): add daily reminders and evidence cleanup
```

---

## Phase 12: Deployment to Vercel

Ask Codex:

```text
Read AGENTS.md. Do not make changes yet.
Create a deployment-readiness plan for Vercel and Supabase.
Include env vars, Supabase redirect URLs, storage bucket setup, migrations, seed data, free-tier monitoring, and smoke tests.
Wait for approval.
```

After approval:

```text
Implement the approved deployment documentation and any small config fixes.
Do not add paid services.
Run build and provide final deployment checklist plus recommended commit messages.
```

Recommended commit message:

```bash
docs: add Vercel and Supabase deployment guide
```

---


## Minimal-input Codex prompts for worktree phases

Use this once at the beginning:

```text
Read AGENTS.md and CODEX_IMPLEMENTATION_GUIDE.md.
Set up the implementation plan so each approved phase uses one branch, one Git worktree, and one Codex session.
Do not make changes yet.
Create docs/ROADMAP.md only if needed, and include branch names, worktree paths, acceptance criteria, checks, and commit message examples for every phase.
Wait for approval before Phase 1.
```

Use this to approve a phase:

```text
Approved. Implement this phase only in its dedicated worktree and branch.
Do not expand scope.
Do not introduce paid services.
Do not change auth/security architecture beyond the approved plan.
Update docs, including docs/PHASE_HANDOFF.md.
Run lint, typecheck, tests, and build if available.
Return a concise summary, changed files, setup steps, risks, merge guidance, cleanup commands, and recommended commit message.
```

Use this after a phase completes:

```text
Review the completed phase against AGENTS.md and the acceptance criteria.
If complete, recommend the commit message and exact merge/cleanup steps.
Then propose the next phase with branch name, worktree path, intended changes, and acceptance criteria.
Wait for approval before starting the next phase.
```

---
## Practical no-cost recommendations

Use these defaults unless the user approves otherwise:

- Use Supabase email/password or magic link and Google OAuth for parent auth.
- Keep phone auth disabled until an SMS provider is configured.
- Use deterministic chore generation, not AI APIs.
- Use Supabase private Storage for photos with short retention.
- Use Vercel Route Handlers for server endpoints.
- Use one daily Vercel Cron route for reminder generation and photo cleanup if needed.
- Use in-app/browser reminders before paid email/SMS.
- Keep evidence photos small and auto-delete them.
- Avoid Vercel Blob, paid analytics, paid observability, paid email, paid queues, and paid SMS unless approved.
- Add seed data so the app is useful locally without manual setup.

---

## Suggested MVP acceptance criteria

The app is MVP-ready when:

- Parent can sign up/sign in.
- Parent can create family.
- Parent can add 3 kids with ages, abilities, dislikes, and schedules.
- Parent can configure house rooms.
- App generates editable chore templates.
- Parent can generate daily assignments fairly.
- Family can view everyone’s schedule at a glance.
- Kid can see assigned chores and subtasks.
- Kid can submit completion.
- Parent can approve/reject.
- Points ledger updates correctly.
- Rewards can be redeemed with parent approval.
- Leaderboard is family-private and age-aware.
- Evidence photos are private and have retention cleanup documented.
- Supabase and Vercel setup docs are complete.
- App builds successfully on Vercel.


# Implementation Roadmap

This roadmap converts `AGENTS.md`, `CODEX_IMPLEMENTATION_GUIDE.md`,
`docs/WORKTREE_PHASE_WORKFLOW.md`, `docs/PRODUCT_SPEC.md`, and
`docs/TECHNICAL_GUIDE.md` into an execution plan.

Operating rule for every implementation phase:

- One approved phase = one branch = one isolated Git worktree = one Codex session.
- Do not implement phases directly on `main` unless the owner explicitly asks for it.
- Start each phase from the latest approved `main`.
- Produce a phase-specific implementation plan and wait for approval before editing.
- Keep each branch limited to its approved phase.
- Run available checks before recommending merge.
- Do not merge back to `main` until the owner approves the completed phase.
- Update `docs/PHASE_HANDOFF.md` at the end of every implementation phase.

Standard phase start commands, run from the main repo folder after approval:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git worktree add ../family-app-phase-XX-name -b phase/XX-name main
cd ../family-app-phase-XX-name
```

Standard checks to run from the phase worktree before review:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a script does not exist, report it honestly and add it only when it is in the
approved phase scope.

## Phase 0: Repo Instructions

- Branch: `phase/00-repo-instructions`
- Worktree: `../family-app-phase-00-repo-instructions`
- Status: effectively complete in the current repository because `AGENTS.md` and
  supporting planning docs already exist.
- Intended changes: add project instructions and Codex workflow docs.
- Acceptance criteria: repo contains the required guidance for phases,
  worktrees, free-tier constraints, Supabase/Vercel setup, and definition of
  done.
- Checks to run: docs review only unless a package is already bootstrapped.
- Supabase/Vercel setup impact: none.
- Free-tier risks: none.
- Recommended commit message: `chore: add Codex guidance for family app development`

## Phase 1: Bootstrap App Foundation

- Branch: `phase/01-bootstrap-foundation`
- Worktree: `../family-app-phase-01-bootstrap-foundation`
- Intended changes: create the Next.js App Router TypeScript foundation with
  Tailwind, strict TypeScript, base app shell, basic route structure, README,
  `.env.example`, `docs/local-dev.md`, `docs/architecture.md`, package scripts,
  and initial test tooling.
- Acceptance criteria: app boots locally, has a mobile-first shell, includes
  typed project structure, documents local setup, and exposes `lint`,
  `typecheck`, `test`, and `build` scripts where practical.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: document expected env vars only; no project dashboard
  changes required yet.
- Vercel setup impact: document future Vercel Hobby deployment expectations; no
  deployment required.
- Free-tier risks: avoid paid UI kits, analytics, AI APIs, hosted observability,
  or paid services.
- Recommended commit message: `chore: bootstrap Next.js family app foundation`

## Phase 2: Supabase Auth

- Branch: `phase/02-auth`
- Worktree: `../family-app-phase-02-auth`
- Intended changes: add Supabase SSR auth utilities, sign-in/sign-up/sign-out,
  OAuth callback route, protected app layout, email auth, Google provider entry,
  optional phone auth UI/docs behind `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false`, and
  `docs/auth-setup.md`.
- Acceptance criteria: parent/caregiver users can sign up, sign in, sign out,
  hit a protected route, and are redirected safely through callback handling.
  Phone auth remains disabled by default and documented as cost-sensitive.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, plus manual auth flow notes if no test Supabase project is
  available.
- Supabase setup impact: document Site URL, Redirect URLs, email auth, Google
  OAuth provider setup, publishable key, secret key handling, and phone provider
  cost caveat.
- Vercel setup impact: document auth env vars and callback URL configuration.
- Free-tier risks: Google/email auth are low-cost defaults; SMS/phone auth may
  incur provider costs and must not be enabled without approval.
- Recommended commit message: `feat(auth): add Supabase email and provider authentication`

## Phase 3: Database Schema and RLS

- Branch: `phase/03-db-rls`
- Worktree: `../family-app-phase-03-db-rls`
- Intended changes: add Supabase migrations for the core family, member,
  schedule, chore, task, submission, reward, points, reminder, settings, and
  audit tables; enable RLS; add family-scoped policies; add starter seed data
  for chore templates; document the data model.
- Acceptance criteria: all family-owned tables have `family_id` where
  appropriate, RLS is enabled, parent/child access boundaries are expressed in
  policies, indexes support expected queries, and seed data is reviewable.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, plus migration dry-run or SQL verification notes if Supabase
  CLI/local database is unavailable.
- Supabase setup impact: document project creation, applying migrations, seed
  data, RLS policy review, and optional type generation.
- Vercel setup impact: none beyond existing env vars.
- Free-tier risks: keep schema compact, avoid large seed assets, document
  database/storage limits.
- Recommended commit message: `feat(db): add family chore schema and RLS policies`

## Phase 4: Family and Child Profiles

- Branch: `phase/04-family-profiles`
- Worktree: `../family-app-phase-04-family-profiles`
- Intended changes: add parent-managed family setup, child profile creation,
  deactivate/remove flow, age/ability/preferences, disliked chores, and
  under-the-weather/sick/rest status management.
- Acceptance criteria: a signed-in parent can create a family, add three kids,
  set age/ability/dislikes/status, and deactivate a child without hard-deleting
  history. Server-side permission checks prevent child or unrelated access.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: may require policy refinements or seed adjustments; no
  paid services.
- Vercel setup impact: none.
- Free-tier risks: minimal; avoid unnecessary analytics or behavioral tracking.
- Recommended commit message: `feat(family): add parent-managed child profiles`

## Phase 5: Family Schedule

- Branch: `phase/05-schedule`
- Worktree: `../family-app-phase-05-schedule`
- Intended changes: add family day/week schedule views, member lanes,
  color/avatar indicators, filters, extracurricular events, blocked time,
  sick/rest entries, chore/event display, and conflict warnings.
- Acceptance criteria: parents can edit all family schedule events; children can
  add/edit their own extracurricular entries where enabled; everyone can view
  family schedule at a glance with accessible loading, empty, and error states.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: schedule policy and index verification.
- Vercel setup impact: none.
- Free-tier risks: keep schedule queries efficient; no paid calendar APIs by
  default.
- Recommended commit message: `feat(schedule): add family day and week views`

## Phase 6: Chore Templates and House-Based Generation

- Branch: `phase/06-chore-templates`
- Worktree: `../family-app-phase-06-chore-templates`
- Intended changes: add house profile setup, room/home-feature configuration,
  starter chore library, deterministic template generation, subtasks,
  dependencies, safety notes, evidence requirements, and parent review/edit UI
  before templates become active.
- Acceptance criteria: parents can configure house features, generate editable
  chore templates from deterministic rules, and manage active templates. Only
  parents can create/edit/delete templates.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: possible seed updates and policy checks for
  house/chore tables.
- Vercel setup impact: none.
- Free-tier risks: no paid AI chore generation; keep generation rule-based.
- Recommended commit message: `feat(chores): generate chore templates from house profile`

## Phase 7: Fair Assignment Engine

- Branch: `phase/07-assignment-engine`
- Worktree: `../family-app-phase-07-assignment-engine`
- Intended changes: add deterministic assignment scoring and parent preview
  flow that considers age, ability, schedule, sick/rest status, difficulty,
  points, disliked chores, undesirable rotation, workload history, completion
  history, dependencies, and parent overrides.
- Acceptance criteria: assignments are explainable, store a constructive
  `assignment_reason`, respect safety and schedule constraints, support parent
  override, and have focused unit tests for core scoring rules.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: task instance policy/index verification and possible
  audit event additions.
- Vercel setup impact: none unless implemented through a route handler.
- Free-tier risks: no AI APIs or paid workers; keep computation request-scoped
  and efficient.
- Recommended commit message: `feat(chores): add rule-based fair assignment engine`

## Phase 8: Kid Task Experience and Submissions

- Branch: `phase/08-kid-submissions`
- Worktree: `../family-app-phase-08-kid-submissions`
- Intended changes: add kid "My Today" page, chore cards, subtasks, checklist
  completion, notes, submission states, optional private evidence upload,
  signed evidence previews, and friendly completion feedback.
- Acceptance criteria: kids can view their assigned chores, complete checklists,
  submit work, and upload evidence only when allowed. Evidence uses private
  Supabase Storage, app-level size limits, and server-side permission checks.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: create private `task-evidence` bucket, storage
  policies, evidence metadata docs, and signed URL access path.
- Vercel setup impact: document any evidence route handlers and upload limits.
- Free-tier risks: storage and egress usage from photos; enforce compression,
  2-5 MB max size, private bucket, and retention planning.
- Recommended commit message: `feat(tasks): add kid checklist submissions and evidence upload`

## Phase 9: Parent Review and Points Ledger

- Branch: `phase/09-parent-review-points`
- Worktree: `../family-app-phase-09-parent-review-points`
- Intended changes: add parent review queue, approve/reject actions,
  supportive rejection feedback, resubmission windows, reduced redeemable points
  after rejection, points ledger writes, and audit events.
- Acceptance criteria: only parents can approve/reject; approved tasks update
  the immutable points ledger; rejection language stays constructive; points
  calculations are tested.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: verify review, points, and audit policies.
- Vercel setup impact: none unless server routes are added.
- Free-tier risks: minimal; keep audit/ledger records compact.
- Recommended commit message: `feat(points): add parent reviews and points ledger`

## Phase 10: Rewards and Leaderboard

- Branch: `phase/10-rewards-leaderboard`
- Worktree: `../family-app-phase-10-rewards-leaderboard`
- Intended changes: add non-monetary reward catalog, redemption requests,
  parent approval flow, age tags, points deduction, private family leaderboard,
  personal progress, streaks, improvement, and teamwork views.
- Acceptance criteria: rewards default to non-monetary options, redemptions
  require parent approval, leaderboard avoids raw-points-only ranking and
  shaming language, and permission boundaries are tested.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: reward, redemption, leaderboard, and points policy
  verification.
- Vercel setup impact: none.
- Free-tier risks: avoid paid rewards, paid prize integrations, or external
  services by default.
- Recommended commit message: `feat(rewards): add non-monetary rewards and family leaderboard`

## Phase 11: Reminders and Evidence Cleanup

- Branch: `phase/11-reminders-cleanup`
- Worktree: `../family-app-phase-11-reminders-cleanup`
- Intended changes: add in-app reminder center, due-soon/overdue reminders,
  optional browser notification prompts, secured daily cleanup/reminder cron
  route, `CRON_SECRET` validation, evidence retention cleanup, and retention
  docs.
- Acceptance criteria: reminders work in-app without paid messaging; cleanup
  targets approved/rejected evidence older than the configured retention period;
  cron route is protected; no SMS/email provider is added by default.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: document evidence cleanup behavior, storage retention,
  and any cleanup queries.
- Vercel setup impact: document `CRON_SECRET`, optional `vercel.json` cron, and
  Hobby/free-tier cron expectations.
- Free-tier risks: Vercel Cron limits, function duration, storage retention, and
  notification limitations; avoid high-frequency jobs and paid messaging.
- Recommended commit message: `feat(reminders): add daily reminders and evidence cleanup`

## Phase 12: Deployment Polish

- Branch: `phase/12-deployment-polish`
- Worktree: `../family-app-phase-12-deployment-polish`
- Intended changes: complete deployment readiness docs, Supabase/Vercel setup
  checklists, smoke tests, `.env.example` review, usage monitoring notes, final
  accessibility pass, and small config fixes required for Vercel builds.
- Acceptance criteria: a new developer can clone, configure Supabase, run
  migrations/seed data, configure Vercel, deploy, and smoke-test the MVP without
  needing hidden conversation context. The app builds successfully unless a
  documented external setup blocker remains.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, plus deployment-readiness smoke checklist.
- Supabase setup impact: final docs for project settings, auth callbacks,
  storage bucket, migrations, seed data, and monitoring.
- Vercel setup impact: final docs for project import, env vars, build settings,
  cron, domain/app URL, and free-tier usage monitoring.
- Free-tier risks: summarize all known limits and operational guardrails for
  Supabase and Vercel Hobby.
- Recommended commit message: `docs: add Vercel and Supabase deployment guide`

## Phase 13: Secure Kid Access

- Branch: `phase/13-kid-mode-pin`
- Worktree: `../family-app-phase-13-kid-mode-pin`
- Intended changes: add parent-managed Kid Mode with hashed PIN credentials,
  signed HttpOnly child-session cookies, a Kid Mode unlock/exit route, parent
  PIN setup/reset controls, child-mode task submission support, route-level
  parent gates, and documentation for optional linked Supabase Auth child
  accounts.
- Acceptance criteria: parents can set/reset a child PIN; children can unlock a
  limited Kid Mode profile on a parent-authenticated device; Kid Mode can submit
  only that child's tasks; parent-only settings, chore template, and assignment
  pages redirect away from child context; PINs are never stored plaintext; older
  linked child auth accounts continue to use `family_member_auth_links` and RLS.
- Checks to run: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- Supabase setup impact: apply the `family_member_pin_credentials` migration;
  verify RLS keeps PIN hashes parent-only; keep `SUPABASE_SECRET_KEY`
  server-only for validated child-mode task writes.
- Vercel setup impact: add `CHILD_SESSION_SECRET` and redeploy after env var
  changes.
- Free-tier risks: minimal cost impact; no SMS, paid auth, paid workers, or paid
  messaging. Main risk is security clarity: Kid Mode is household profile
  switching, not a separate child password.
- Recommended commit message:
  `feat(auth): add parent-managed kid mode with PIN sessions`

## Review, Merge, and Cleanup Gate

At the end of each approved phase, review from inside that phase worktree:

```bash
git status --short
git diff --stat main...HEAD
git diff main...HEAD
npm run lint
npm run typecheck
npm test
npm run build
```

After owner approval, commit, merge, and clean up:

```bash
git add .
git commit -m "<recommended Conventional Commit message>"
git checkout main
git pull --ff-only origin main
git merge --no-ff phase/XX-name
git push origin main
git worktree remove ../family-app-phase-XX-name
git branch -d phase/XX-name
git worktree prune
```

Use a GitHub pull request instead of local merge if preferred. Never force-remove
a worktree or branch without explicit approval and a clear explanation of what
would be lost.

## Phase 1 Approval Gate

Next action after this roadmap is owner approval for Phase 1 planning and then
implementation in:

- Branch: `phase/01-bootstrap-foundation`
- Worktree: `../family-app-phase-01-bootstrap-foundation`

No Phase 1 code changes should start until the owner explicitly approves the
Phase 1 plan.

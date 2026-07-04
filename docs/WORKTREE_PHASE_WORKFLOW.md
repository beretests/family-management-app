# Git Worktree Phase Workflow

Use this with `AGENTS.md` and `CODEX_IMPLEMENTATION_GUIDE.md`. The core operating model is: one approved phase = one branch = one isolated worktree = one Codex session.

---

## Git worktree phase workflow

Use Git worktrees to keep Codex work isolated, reviewable, and faster to execute.

Default rule:

> One approved phase = one branch = one isolated worktree = one Codex session.

Do not implement approved phases directly in the main working tree unless the owner explicitly asks for it.

### Branch and worktree naming

Use short, predictable names:

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

Recommended local worktree folders:

```bash
../family-app-phase-00-repo-instructions
../family-app-phase-01-bootstrap-foundation
../family-app-phase-02-auth
../family-app-phase-03-db-rls
```

If the repository name is different, keep the pattern: `../<repo-name>-<branch-slug>`.

### Phase start procedure

Before starting implementation for an approved phase, the agent must:

1. Confirm the current phase name and approved scope.
2. Confirm the base branch, normally `main`.
3. Confirm that the main worktree is clean or state any existing changes.
4. Create a new branch and worktree from the latest approved base.
5. Start a fresh Codex session inside that worktree.
6. Re-read `AGENTS.md` and the relevant docs inside that worktree.

Suggested commands:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git worktree add ../family-app-phase-02-auth -b phase/02-auth main
cd ../family-app-phase-02-auth
```

If `main` is not the base branch, state the actual base branch before creating the worktree.

### During the phase

Within a phase worktree, Codex may implement the approved scope without repeated file-by-file approval.

Rules:

- Keep the diff focused on the approved phase.
- Do not modify unrelated files just because they are nearby.
- Do not mix two phases in one branch.
- Do not work on the same branch from two separate worktrees.
- Do not create database migrations in multiple parallel branches unless the owner approved parallel database work.
- If the implementation needs scope expansion, stop and propose the change before editing further.
- Keep docs updated in the same branch when the phase changes setup, architecture, Supabase, Vercel, auth, storage, cron, or environment variables.

### Parallel work rules

Parallel worktrees are allowed for speed, but only when branches are unlikely to conflict.

Safe parallel examples:

- UI polish branch while another branch updates documentation.
- Test coverage branch while another branch implements a small isolated component.
- README/docs branch while another branch implements a non-overlapping feature.

Avoid parallel work for:

- Supabase migrations.
- RLS policy changes.
- Auth/session architecture.
- Shared layout or navigation refactors.
- Dependency upgrades.
- Large data-model changes.
- Anything that changes `.env.example`, deployment config, or storage policies.

When in doubt, finish and merge the active phase before starting another one.

### Phase completion procedure

After implementation, the agent must run available checks from inside the phase worktree:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a script does not exist, report it and suggest adding it in an appropriate phase. Do not claim a check passed unless it actually ran successfully.

Then the agent must provide:

1. Summary of implemented changes.
2. Changed files.
3. Database migrations and policy changes.
4. Supabase/Vercel/manual setup steps.
5. Commands run and results.
6. Risks, limitations, and follow-ups.
7. Recommended commit message.
8. Recommended merge approach.

### Review and merge gate

Do not merge a phase branch into `main` until the owner approves the result.

Recommended merge flow:

```bash
git status --short
git diff --stat main...HEAD
git diff main...HEAD
npm run lint
npm run typecheck
npm test
npm run build
git add .
git commit -m "feat(auth): add Supabase email and provider authentication"
git checkout main
git pull --ff-only origin main
git merge --no-ff phase/02-auth
git push origin main
```

If using GitHub pull requests, open a PR instead of merging locally. The PR title should use the recommended Conventional Commit message.

### Worktree cleanup

After a phase is merged and verified on `main`, clean up the worktree and branch only when all changes are safely committed and merged.

Suggested commands:

```bash
git worktree list
git worktree remove ../family-app-phase-02-auth
git branch -d phase/02-auth
git worktree prune
```

Never force-remove a worktree or branch unless the owner approves and the agent has clearly explained what would be lost.

### Codex session handoff between phases

At the end of every phase, Codex should produce a short handoff note that the next Codex session can read without needing full conversation history.

Add or update `docs/PHASE_HANDOFF.md` with:

- current merged phase
- branch name
- worktree path used
- implemented features
- manual setup still required
- known issues
- next recommended phase
- commands that passed or failed

Keep the handoff concise and factual.

---

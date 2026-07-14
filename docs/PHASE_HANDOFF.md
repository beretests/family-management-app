# Phase Handoff

## Current Phase

Phase 16: Adult Family Invites and Auto-Updating Ages

## Branch and Worktree

- Branch: `phase/16-adult-family-invites`
- Worktree: `../family-app-phase-16-adult-family-invites`
- Base branch: `main` at `8120006` (`fix(schedule): fall back to legacy member events when attendee table is missing`)

## Implemented Features

- Added `family_invitations` with pending, accepted, revoked, and expired
  statuses.
- Added parent-managed invites for other parents or caregivers.
- Added invite acceptance at `/family/invite/accept?invite=<id>`.
- Validated invite acceptance against the signed-in user's email address.
- Kept pending adult members inactive until acceptance, then linked accepted
  adults through `profiles`, `family_members.profile_id`, and
  `family_member_auth_links`.
- Added pending invite revocation and accepted adult deactivation.
- Prevented deactivation from leaving a family without an accepted active
  parent.
- Changed child profile entry from static age to birth month/year.
- Stored birth month/year in existing `family_members.birthdate` as the first
  day of the selected month.
- Calculated current age from birthdate with `age_years` kept as legacy
  fallback.

## Manual Setup Still Required

- Apply the new Supabase migration:

```bash
supabase db push
```

- Set `SUPABASE_SECRET_KEY` server-side in local/Vercel environments before
  sending invite emails.
- Confirm Supabase Auth redirect allow-list includes `/callback` for local and
  production domains.
- Confirm `NEXT_PUBLIC_APP_URL` matches the production deployment URL before
  testing invite links in Vercel.

## Known Issues and Limitations

- Invite emails use Supabase hosted auth email delivery; rate and volume limits
  apply on the free tier.
- Caregivers can be linked to the family, but parent-only settings remain
  limited to the `parent` role.
- This phase stores month/year only by writing day `01` into `birthdate`; it
  does not collect exact birthdays.
- Existing child rows without `birthdate` continue to use `age_years` until a
  parent edits the profile.

## Next Recommended Phase

- Add guided onboarding for new families: family setup, child profiles,
  starter chores, schedule basics, and first invite.

## Checks

- `npm install` passed. npm reported 2 moderate vulnerabilities in existing
  dependencies.
- Initial `npm run lint`, `npm run typecheck`, and `npm test` failed before
  install because this sibling worktree did not have local dependencies.
- `npm run lint` passed after install.
- Initial `npm run typecheck` failed because the sandbox could not write
  `tsconfig.tsbuildinfo` in the sibling worktree.
- `npm run typecheck` passed with worktree write permission, then passed again
  after restoring generated `next-env.d.ts` churn.
- `npm test` passed: 23 files, 77 tests.
- `npm run build` passed with worktree write permission.

# Product Specification: Family Management App for Kids

This file contains the detailed product, UX, chore, schedule, fairness, reward, and reminder requirements. Codex must read the relevant sections before implementing product behavior.

---

## Project: Family Management App for Kids

This repository is for a family management app built with **Next.js**, hosted on **Vercel**, and backed by **Supabase** for database, auth, storage, and optional edge/server functions. The app must be fun and intuitive for both parents and children while remaining safe, private, low-cost, and easy for a new developer to understand.

The initial product goal is a family schedule and chore-management app where parents can manage kids, generate and assign fair chores, review evidence, track history, manage rewards, and see the whole family schedule at a glance.

Example target family scenario:

> A parent has 3 kids, ages 8, 11, and 14. The 8-year-old hates cleaning bathrooms, the 14-year-old has soccer on Tuesdays and Thursdays, and chores should be distributed fairly every day while considering schedules, age, ability, illness, disliked chores, and completion history.

## Product principles

The app should feel like a helpful family assistant, not a punishment system.

Prioritize:

- Fairness over strict equality.
- Encouragement over shame.
- Simple language for kids.
- Clear parent controls.
- Colorful but calm UI.
- Large touch targets and mobile-first layouts.
- Visual schedules at a glance.
- Transparent chore assignment reasons.
- Age-appropriate tasks.
- Respect for sickness, fatigue, school, extracurriculars, and family realities.
- Privacy and safety for children’s data and images.

Avoid:

- Public leaderboards.
- Shaming labels such as “lazy,” “bad,” or “worst.”
- Punitive dark patterns.
- Overly competitive scoring that makes younger kids always lose.
- Storing child photos longer than needed.
- Showing sibling comparisons without constructive context.
- Collecting analytics or behavioral tracking without a documented privacy decision.

---

## Core roles and permissions

Use family-scoped roles. A user can belong to more than one family in the future, but MVP may support one family per parent.

Recommended roles:

- `parent`: Can create/edit/delete family, kids, task templates, chores, schedules, rewards, approvals, and settings.
- `caregiver`: Optional future role. Can view and assist but may have limited admin rights.
- `child`: Can view family schedule, view assigned chores, submit completion, upload evidence when allowed, request swaps, add/edit own extracurricular schedule entries, and mark under-the-weather status if enabled.

Rules:

- Only parents can create/edit task templates and chores.
- Only parents can approve/reject chore submissions.
- Kids can submit chore evidence and checklist completion.
- Kids can request chore swaps; swaps should require parent approval in the MVP unless the user asks for automatic approval rules.
- Kids and parents can add extracurricular schedule entries. Kids can edit their own schedule entries; parents can edit all family schedule entries.
- Parents can add/remove kids.
- Removing a kid should soft-delete/deactivate their profile rather than hard-delete history unless the user explicitly requests deletion.

---

## Child account model

Recommended MVP model:

1. Parent/caregiver accounts use Supabase Auth.
2. Children are family member profiles created by a parent.
3. Younger kids can use a local “Kid Mode” profile switcher/PIN flow rather than requiring their own email or phone number.
4. Older kids may optionally be invited to create their own Supabase Auth account later.

When implementing Kid Mode:

- Do not pretend a child PIN is equivalent to full account security.
- Store PIN hashes only; never store PINs in plain text.
- Use HttpOnly cookies for lightweight child session state where needed.
- Route all child-profile actions through server-side code that verifies family membership and allowed action type.
- Never expose Supabase secret or admin keys in the browser.

If implementing separate child Supabase Auth accounts:

- Parent must invite/link the account to a family member profile.
- RLS must enforce family membership.
- Child accounts must not gain parent-only permissions.

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
CHILD_SESSION_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
CRON_SECRET=
```

Only use `SUPABASE_SECRET_KEY` server-side for carefully reviewed admin operations, cleanup jobs, or child-mode route handlers that cannot rely on a user JWT. Prefer user-scoped Supabase clients and RLS wherever possible. Do not use Supabase's legacy `service_role` key for production app deployment unless a documented tool limitation requires it.

---

## UX requirements

The app must serve both parents and children.

Parent UX:

- Dashboard summary: today’s chores, pending approvals, sick/under-the-weather flags, schedule conflicts, family workload balance, and reminders.
- Family schedule: day/week/month views with family member avatars, color coding, filters, and conflict indicators.
- Chore generator: house setup wizard, task template library, daily/weekly generated chores, fairness preview, and manual override.
- Review queue: evidence photos, checklist status, child notes, approve/reject, kind rejection feedback, and resubmission deadlines.
- Rewards: non-monetary reward catalog, redemption approvals, year-end prize settings.
- Insights: workload imbalance, recurring non-completion, tasks that are too hard, and suggested new responsibilities.

Kid UX:

- “My Today” page with simple cards, due times, points, subtasks, and encouraging progress.
- Checklist-driven completion.
- Evidence upload when required.
- Swap request flow with friendly language.
- Family schedule glance view.
- Personal points/rewards view.
- Clear status: assigned, started, submitted, approved, rejected, overdue.
- Celebration on completion without overdoing animations.

Accessibility:

- Use semantic HTML and accessible components.
- All controls must be keyboard-accessible.
- Use readable contrast and text sizes.
- Do not rely on color alone to communicate status.
- Use short labels, icons, and helper text for kids.
- Add loading, empty, and error states for every major screen.

---

## Family schedule requirements

The family schedule is a core feature, not an afterthought.

Each family member should be able to view everyone’s schedule at a glance.

Implement:

- Family day view.
- Family week view.
- Optional month view after MVP.
- Member color/avatar lane.
- Chores shown beside extracurricular and family events.
- Busy/unavailable windows.
- Sick/under-the-weather entries.
- Conflict warnings when a chore is assigned too close to practice, school, appointment, or bedtime.
- Filters: everyone, one member, chores only, activities only, overdue only.

Schedule event types:

- School.
- Extracurricular.
- Appointment.
- Family event.
- Rest/sick.
- Parent work/blocked time.
- Parent away.
- Parent activity.
- Chore/task.

Events may apply to the whole family or to one or more selected family members.
When an event appears in multiple member lanes, summary counts should still
count it as one unique event.

Kids may add their own extracurricular schedule entries. Parent can edit all entries.

---

## Chore and task domain model

Tasks are not only in-home chores. Support home, yard, garden, car, groceries, errands, pet care, seasonal chores, and family-help tasks.

Recommended chore template fields:

- `id`
- `family_id`
- `title`
- `emoji`
- `description`
- `category`
- `location`
- `frequency` such as daily, weekly, monthly, seasonal, ad hoc
- `estimated_minutes`
- `difficulty` from 1-5
- `base_points`
- `minimum_age`
- `maximum_age` optional
- `requires_parent_review`
- `requires_evidence`
- `evidence_type` optional, such as photo or note
- `undesirable_score` from 0-5
- `dependency_template_ids`
- `subtasks`
- `completion_check_text`
- `safety_notes`
- `active`

Recommended task instance fields:

- `id`
- `family_id`
- `template_id`
- `assigned_to_member_id`
- `created_by_member_id`
- `title_snapshot`
- `subtasks_snapshot`
- `points_possible`
- `points_awarded`
- `status`
- `due_at`
- `available_from`
- `completed_at`
- `submitted_at`
- `approved_at`
- `rejected_at`
- `rejection_count`
- `rejection_reason`
- `assignment_reason`
- `difficulty_snapshot`
- `estimated_minutes_snapshot`
- `is_undesirable`
- `created_at`
- `updated_at`

Statuses:

- `draft`
- `assigned`
- `in_progress`
- `submitted`
- `approved`
- `rejected`
- `overdue`
- `cancelled`

---

## Starter chore templates

Use these as seed data or task-template fixtures. Keep them editable by parents.

### 🍽️ Wash Dishes

Subtasks:

- Empty dishwasher and dish drying mat.
- Wash all dishes in sink; no visible food residue.
- Dry and return items to correct places.
- Wipe sink and surrounding counters, including back counters.
- Clear and wipe/scrub dining table and chairs completely.
- Wash, rinse, and hang wipe cloth to dry.

Completion check:

- No dishes left.
- Sink clean.
- Counters dry and clutter-free.

Suggested frequency: daily.
Suggested difficulty: 3.
Suggested age: 10+ unless assisted.

### 🍽️ Clean Gas Cooker

Subtasks:

- Wash and dry grates.
- Clean burner caps.
- Wipe knobs.
- Clean cooker surface.
- Wipe exterior hood.
- Remove grease buildup.

Completion check:

- No grease on cooker.

Suggested frequency: weekly or after heavy cooking.
Suggested difficulty: 4.
Suggested age: 12+.
Safety note: Parent should configure whether this is safe for younger children.

### 🧹 Sweep Kitchen

Subtasks:

- Sweep entire floor, including dining area.
- Collect debris and dispose of trash and compost in outside bins.
- Collect recycling for Sarcan and arrange in garage.

Completion check:

- No visible crumbs or dirt on floor.
- Trash cans empty.
- Recycling container empty.

Suggested frequency: daily.
Suggested difficulty: 2.
Suggested age: 8+.

### 🧼 Mop Kitchen

Subtasks:

- Confirm sweeping is complete first.
- Mop entire floor using configured solution or steam mop.
- Allow floor to dry with no footprints.

Completion check:

- Floor visibly clean.
- No sticky spots.

Suggested frequency: weekly or as needed.
Suggested difficulty: 3.
Suggested age: 10+.
Dependency: Sweep Kitchen.

### 🛋️ Clean Parlour / Living Room

Subtasks:

- Arrange cushions.
- Fold blankets.
- Remove trash and items that do not belong.
- Light dust surfaces.
- Vacuum or sweep floor.

Completion check:

- Room tidy.
- No visible clutter.

Suggested frequency: daily or every other day.
Suggested difficulty: 2.
Suggested age: 8+.

### 🚽 Clean Guest Half Bathroom

Subtasks:

- Clean toilet seat and bowl.
- Wipe sink and counter.
- Clean mirror.
- Replace hand towel.
- Sweep/mop floor.

Completion check:

- No stains.
- Smells fresh.

Suggested frequency: weekly.
Suggested difficulty: 4.
Suggested age: 11+.
Undesirable score: high.

### 👕 Clean Entry Closet

Subtasks:

- Arrange shoes neatly.
- Hang coats properly.
- Remove trash/unnecessary items.

Completion check:

- Organized and easy to access.

Suggested frequency: daily or weekly depending on family settings.
Suggested difficulty: 2.
Suggested age: 8+.

### 🚪 Clean Front Entryway

Subtasks:

- Sweep floor.
- Arrange shoes and mats.
- Wipe door handle and surfaces.

Completion check:

- Clean and uncluttered.

Suggested frequency: daily or every other day.
Suggested difficulty: 2.
Suggested age: 8+.

### 🪜 Clean Stairs

Subtasks:

- Remove items on stairs.
- Sweep or vacuum steps.
- Wipe handrails.

Completion check:

- No debris on steps.

Suggested frequency: weekly.
Suggested difficulty: 3.
Suggested age: 9+.
Safety note: Parent should approve for younger kids.

### 🛋️ Clean Upstairs Living Room

Subtasks:

- Declutter.
- Arrange furniture/cushions.
- Vacuum or sweep.

Completion check:

- Room tidy.
- Floor clean.

Suggested frequency: weekly or every other day.
Suggested difficulty: 2.
Suggested age: 8+.

### 🧺 Clean Laundry Room

Subtasks:

- Remove lint and trash.
- Wipe machines.
- Sweep/mop floor.
- Organize supplies.

Completion check:

- Clean surfaces.
- Clean floor.

Suggested frequency: weekly.
Suggested difficulty: 3.
Suggested age: 10+.

### 🚿 Clean Bathroom - General

Subtasks:

- Clean toilet.
- Clean sink.
- Clean mirror.
- Wipe counters.
- Sweep/mop.
- Empty trash.

Completion check:

- No stains.
- Smells clean.

Suggested frequency: weekly.
Suggested difficulty: 4.
Suggested age: 11+.
Undesirable score: high.

### 🛁 Clean Upstairs Full Bathroom

Subtasks:

- Complete general bathroom tasks.
- Clean tub/shower walls.
- Rinse and wipe dry.

Completion check:

- No soap scum.

Suggested frequency: weekly.
Suggested difficulty: 5.
Suggested age: 12+.
Undesirable score: high.

### 🗂️ Arrange Upstairs Hallway Closet

Subtasks:

- Fold/organize items.
- Remove unused items to parent review pile.
- Stack neatly.

Completion check:

- Easy to find items.

Suggested frequency: weekly or monthly.
Suggested difficulty: 2.
Suggested age: 8+.

---

## House-based chore generation

Parents should be able to enter the type and number of rooms in the home. The app should generate recommended chore templates and schedules.

Recommended house setup fields:

- Number of kitchens.
- Number of dining areas.
- Number of living rooms/parlours.
- Number of half bathrooms.
- Number of full bathrooms.
- Number of bedrooms.
- Laundry room present.
- Stairs present.
- Entryway/closet present.
- Yard present.
- Garden present.
- Garage present.
- Car chores enabled.
- Grocery/errand chores enabled.
- Pets present.

Generation rules:

- Create daily templates for dishes, kitchen sweep, entryway reset, and quick living-room tidy if those rooms exist.
- Create weekly templates for bathrooms, mopping, stairs, laundry room, closets, yard/garden/car tasks as configured.
- Create optional monthly templates for deeper organization.
- Generate task templates, not only task instances, so parents can review and edit before scheduling.
- Never assign a high-risk or heavy chore to a child solely because it exists. Age, ability, and parent safety settings must be respected.

---

## Workload balancing and assignment engine

Implement deterministic balancing first. Do not use paid AI by default.

The assignment engine should consider:

- Child age.
- Parent-entered ability level.
- Chore minimum age and safety notes.
- Schedule availability.
- Due windows.
- Sick/under-the-weather status.
- Recent workload by points and estimated minutes.
- Recent undesirable chore assignments.
- Chore preferences/dislikes.
- Completion history.
- Rejection/resubmission history.
- Dependencies such as sweeping before mopping.
- Parent overrides.

Recommended assignment approach:

1. Generate candidate chores for the day/week.
2. Exclude unavailable or unsafe assignees.
3. Calculate each child’s recent workload across the last 7 and 30 days.
4. Sort chores by due time, difficulty, and dependency order.
5. Score candidate child assignments.
6. Assign the chore to the highest-scoring suitable child.
7. Store a human-readable `assignment_reason`.
8. Show a fairness preview before finalizing.

Suggested scoring factors:

- Suitability for age and ability.
- Available time before due date.
- Fairness gap compared with siblings.
- Recent total points.
- Recent estimated minutes.
- Recent undesirable chore count.
- Whether the child has done the same chore too often.
- Whether the child is under the weather.
- Whether the chore conflicts with extracurriculars.

Example assignment reason:

> Assigned to Ada because she has fewer points this week, is free before dinner, and has not had a bathroom chore recently.

Do not frame assignment reasons negatively.

---

## Handling sickness or being under the weather

Implement a simple family member status feature:

- `normal`
- `under_the_weather`
- `sick`
- `rest_day`

Rules:

- Parent can set status for any child.
- A child may request an under-the-weather status if enabled.
- Sick/rest-day status should reduce or block chore assignment depending on parent settings.
- Under-the-weather status should favor lighter chores and lower estimated minutes.
- The app may suggest redistributing chores, postponing non-urgent tasks, or converting a task to a helper task.

Do not treat sickness as non-compliance.

---

## Rejections and reduced redeemable points

Parents can reject a submission when a chore is incomplete.

Implement:

- Parent rejection reason.
- Checklist items that need correction.
- Optional evidence/photo review.
- Resubmission window.
- Reduced points on resubmission if the child completes the correction within the original or extended timeframe.

Recommended default:

- First approved submission within timeframe: 100% points.
- Rejected then corrected within timeframe: 75% points.
- Rejected then corrected after timeframe: 50% points or parent-configured value.
- Never go below a configured minimum unless parent overrides.

Keep tone supportive:

- “Almost there — please wipe the sink and resubmit.”
- Avoid “failed” language in kid UI.

---

## Swaps between siblings

Implement swaps as requests, not silent reassignment.

Swap flow:

1. Child requests swap.
2. App suggests eligible siblings based on schedule, fairness, age, ability, and workload.
3. Sibling accepts or declines.
4. Parent approves in MVP.
5. App updates assignment and records history.

Rules:

- Do not allow swaps that assign unsafe chores to younger kids.
- Do not allow one child to offload undesirable chores repeatedly.
- Show fairness impact to parent.
- Store swap history.

---

## Detecting imbalance and non-completion

The app should identify patterns and suggest constructive actions.

Detect:

- One child getting more points or minutes than siblings over 7/30 days.
- One child getting too many undesirable chores.
- One child repeatedly not completing a specific chore.
- Chores frequently rejected by parents.
- Chores that often miss due windows.
- Schedule conflicts causing missed chores.

Suggest:

- Reduce task difficulty.
- Split task into smaller subtasks.
- Teach/show how to do the chore.
- Move due time.
- Rotate chore away temporarily.
- Pair child with parent or sibling.
- Offer rest/light-duty day.
- Adjust points if task is harder than expected.

Never label a child negatively.

---

## Rewards and allowances

Rewards should be non-monetary by default.

Reward examples:

- Pick family movie.
- Choose dinner theme.
- Extra bedtime story.
- Choose family game night activity.
- Park outing.
- Invite a friend for a playdate.
- Choose music in the car.
- Pick dessert.
- Special parent-child time.
- Stay up 15 minutes later on a weekend.
- Choose Saturday breakfast.
- Skip one low-difficulty chore with parent approval.
- Pick a family walk route.
- Choose a craft or baking activity.

Reward rules:

- Parents create/edit reward catalog.
- Rewards cost points.
- Rewards can be age-tagged.
- Parent approval required for redemption in MVP.
- Rewards should not require money unless parent adds them.
- Avoid rewards that undermine health, sleep, safety, or sibling fairness.

---

## Leaderboard and year-end prizes

Leaderboards must be family-private, constructive, and age-aware.

Do not rank only by raw points. Raw points can unfairly favor older children.

Recommended scoring blend:

- Completion rate.
- Timeliness.
- Difficulty-adjusted points.
- Improvement over personal baseline.
- Streaks.
- Helpful swaps/assists.
- Low rejection rate.
- Parent-awarded kindness/helpfulness badges.

Leaderboard modes:

- Personal progress.
- This week’s teamwork.
- Most improved.
- Best streak.
- Helper badges.
- Year-end prize standings.

Always show positive framing. Avoid “last place” emphasis.

---

## Reminders

Use free-first reminders.

MVP reminder approach:

- In-app reminder center.
- Today/tomorrow reminders on dashboard.
- Browser notifications if the user grants permission.
- Daily digest generated by a cron job if configured.
- Email reminders only if implemented through a free/approved provider and documented.
- SMS reminders should not be implemented by default because they usually require a paid SMS provider.

Reminder types:

- Chore assigned.
- Chore due soon.
- Chore overdue.
- Submission waiting for parent review.
- Submission rejected with correction needed.
- Reward redemption awaiting approval.
- Schedule conflict warning.

For Vercel Hobby/free tier, avoid relying on precise high-frequency cron timing.

---

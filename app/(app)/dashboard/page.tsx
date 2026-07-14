import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { getTaskInstancesDueBetween } from "@/features/assignments/queries";
import { getChoreTemplates } from "@/features/chores/queries";
import { getFamilyContext } from "@/features/family/queries";
import {
  getReminderCount,
  getUpcomingReminders,
} from "@/features/reminders/queries";
import { getPendingReviewCount } from "@/features/reviews/queries";
import {
  getActiveRewardCount,
  getPendingRewardRedemptionCount,
} from "@/features/rewards/queries";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import { getScheduleEvents } from "@/features/schedule/queries";
import type { ScheduleEvent } from "@/features/schedule/types";
import { endOfDay, formatTimeRange, startOfDay } from "@/lib/dates/schedule";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    return (
      <section className="grid gap-5">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <StatusPill tone="warning">Setup needed</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
            Create your family workspace
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Your account is signed in. Add a family name and parent profile to
            start managing child profiles.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href="/family/setup"
          >
            Start family setup
          </Link>
        </div>
      </section>
    );
  }

  const activeChildren = context.members.filter(
    (member) => member.role === "child" && member.lifecycleStatus === "active",
  );
  const childrenNeedingRest = activeChildren.filter((member) =>
    ["under_the_weather", "sick", "rest_day"].includes(
      member.currentStatus?.status ?? "normal",
    ),
  );
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const [
    todayEvents,
    choreTemplates,
    todayTasks,
    pendingReviews,
    activeRewards,
    pendingRewardRequests,
    reminderCount,
    upcomingReminders,
  ] = await Promise.all([
    getScheduleEvents({
      endsAt: todayEnd,
      familyId: context.family.id,
      startsAt: todayStart,
    }),
    getChoreTemplates(context.family.id),
    getTaskInstancesDueBetween({
      endsAt: todayEnd,
      familyId: context.family.id,
      startsAt: todayStart,
    }),
    getPendingReviewCount(context.family.id),
    getActiveRewardCount(context.family.id),
    getPendingRewardRedemptionCount(context.family.id),
    getReminderCount(context.family.id),
    getUpcomingReminders({
      familyId: context.family.id,
      now: todayStart,
      until: endOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    }),
  ]);

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Protected</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          {context.family.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Parent-managed family profiles and schedules are connected to Supabase
          RLS. Chores, reviews, rewards, and family progress are now connected
          to private family data.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href="/my-today"
          >
            Open My Today
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/schedule"
          >
            Open schedule
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/rewards"
          >
            Open rewards
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Active kids" value={activeChildren.length} />
        <MetricCard label="Rest flags" value={childrenNeedingRest.length} />
        <MetricCard label="Today events" value={todayEvents.length} />
        <MetricCard label="Assigned today" value={todayTasks.length} />
        <MetricCard label="Pending reviews" value={pendingReviews} />
        <MetricCard label="Reward requests" value={pendingRewardRequests} />
        <MetricCard label="Active rewards" value={activeRewards} />
        <MetricCard label="Reminders" value={reminderCount} />
        <MetricCard
          label="Active chores"
          value={choreTemplates.filter((template) => template.active).length}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardActionCard
          body="Manage non-monetary rewards and parent review."
          href="/rewards"
          label="Open rewards"
          title="Rewards"
        />
        <DashboardActionCard
          body="Review a constructive progress board for the family."
          href="/leaderboard"
          label="View board"
          title="Leaderboard"
        />
        <DashboardActionCard
          body="See due-soon chores, parent review items, rewards, and gentle catch-up notes."
          href="/reminders"
          label="Open reminders"
          title="Reminders"
        />
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Today and tomorrow
          </h2>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/reminders"
          >
            View reminders
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {upcomingReminders.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] md:col-span-3">
              No reminders for today or tomorrow.
            </p>
          ) : null}
          {upcomingReminders.slice(0, 6).map((reminder) => (
            <article
              className="rounded-md border border-[var(--line)] p-4"
              key={reminder.id}
            >
              <h3 className="font-semibold text-[var(--foreground)]">
                {reminder.message}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {formatTimeRange(reminder.remindAt, reminder.remindAt, false)}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Chore templates
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Build the library before daily assignment starts.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/assignments"
          >
            Plan assignments
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Approvals
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Review submitted chores and award points.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/approvals"
          >
            Review submissions
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Today
          </h2>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/schedule"
          >
            View week
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {todayEvents.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] md:col-span-3">
              Nothing scheduled today.
            </p>
          ) : null}
          {todayEvents.slice(0, 6).map((event) => (
            <DashboardEventCard
              event={event}
              key={event.id}
              memberName={
                context.members
                  .filter((member) => event.memberIds.includes(member.id))
                  .map((member) => member.displayName)
                  .join(", ") || "Whole family"
              }
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Kids</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {activeChildren.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] md:col-span-3">
              Add child profiles from family settings.
            </p>
          ) : null}
          {activeChildren.map((member) => (
            <article
              className="rounded-md border border-[var(--line)] p-4"
              key={member.id}
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: member.color ?? "#047857" }}
                >
                  {member.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {member.displayName}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Age {member.ageYears ?? "unknown"} · ability{" "}
                    {member.abilityLevel}/5
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Status: {member.currentStatus?.status ?? "normal"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardEventCard({
  event,
  memberName,
}: {
  event: ScheduleEvent;
  memberName: string;
}) {
  return (
    <article className="rounded-md border border-[var(--line)] p-4">
      <h3 className="font-semibold text-[var(--foreground)]">{event.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {formatTimeRange(event.startsAt, event.endsAt, event.allDay)}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {memberName} · {scheduleEventTypeLabels[event.eventType]}
      </p>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--accent-strong)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </article>
  );
}

function DashboardActionCard({
  body,
  href,
  label,
  title,
}: {
  body: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
          href={href}
        >
          {label}
        </Link>
      </div>
    </div>
  );
}

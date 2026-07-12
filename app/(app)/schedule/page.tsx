import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import { ScheduleWeekView } from "@/components/schedule/schedule-week-view";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { findScheduleConflicts } from "@/features/schedule/conflicts";
import { getScheduleEvents } from "@/features/schedule/queries";
import {
  addDays,
  endOfDay,
  endOfWeek,
  formatDateHeading,
  formatShortDate,
  parseDateParam,
  startOfDay,
  startOfWeek,
  toDateParam,
} from "@/lib/dates/schedule";

export const dynamic = "force-dynamic";

type SchedulePageProps = {
  searchParams?: Promise<{
    date?: string;
    view?: string;
  }>;
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const selectedDate = startOfDay(parseDateParam(params?.date));
  const view = params?.view === "week" ? "week" : "day";
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  const rangeStartsAt = view === "week" ? startOfWeek(selectedDate) : selectedDate;
  const rangeEndsAt = view === "week" ? endOfWeek(selectedDate) : endOfDay(selectedDate);
  const events = await getScheduleEvents({
    endsAt: rangeEndsAt,
    familyId: context.family.id,
    startsAt: rangeStartsAt,
  });
  const conflicts = findScheduleConflicts(events);
  const canManage = context.currentMember?.role === "parent";
  const defaultStartsAt = new Date(selectedDate);
  defaultStartsAt.setHours(16, 0, 0, 0);
  const defaultEndsAt = new Date(selectedDate);
  defaultEndsAt.setHours(17, 0, 0, 0);

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusPill tone="info">Schedule</StatusPill>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              {view === "week"
                ? `${formatShortDate(rangeStartsAt)} - ${formatShortDate(rangeEndsAt)}`
                : formatDateHeading(selectedDate)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Track school, activities, appointments, rest days, and family
              events before chores are assigned.
            </p>
          </div>
          <ScheduleControls date={selectedDate} view={view} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Events" value={events.length} />
        <MetricCard label="Conflicts" value={conflicts.size} />
        <MetricCard
          label="Rest flags"
          value={
            context.members.filter((member) =>
              ["under_the_weather", "sick", "rest_day"].includes(
                member.currentStatus?.status ?? "normal",
              ),
            ).length
          }
        />
      </div>

      {canManage ? (
        <CreateScheduleEventForm
          defaultEndsAt={defaultEndsAt.toISOString()}
          defaultStartsAt={defaultStartsAt.toISOString()}
          familyId={context.family.id}
          members={context.members}
        />
      ) : null}

      {view === "week" ? (
        <ScheduleWeekView
          conflicts={conflicts}
          events={events}
          members={context.members}
          weekStartsAt={rangeStartsAt}
        />
      ) : (
        <ScheduleBoard
          canManage={canManage}
          conflicts={conflicts}
          events={events}
          familyId={context.family.id}
          members={context.members}
        />
      )}
    </section>
  );
}

function ScheduleControls({ date, view }: { date: Date; view: "day" | "week" }) {
  const step = view === "week" ? 7 : 1;
  const linkClass =
    "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]";
  const activeLinkClass =
    "inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]";

  return (
    <div className="grid gap-3 sm:min-w-72">
      <div className="grid grid-cols-3 gap-2">
        <Link
          className={linkClass}
          href={`/schedule?view=${view}&date=${toDateParam(addDays(date, -step))}`}
        >
          Previous
        </Link>
        <Link
          className={linkClass}
          href={`/schedule?view=${view}&date=${toDateParam(new Date())}`}
        >
          Today
        </Link>
        <Link
          className={linkClass}
          href={`/schedule?view=${view}&date=${toDateParam(addDays(date, step))}`}
        >
          Next
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          className={view === "day" ? activeLinkClass : linkClass}
          href={`/schedule?view=day&date=${toDateParam(date)}`}
        >
          Day
        </Link>
        <Link
          className={view === "week" ? activeLinkClass : linkClass}
          href={`/schedule?view=week&date=${toDateParam(date)}`}
        >
          Week
        </Link>
      </div>
    </div>
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

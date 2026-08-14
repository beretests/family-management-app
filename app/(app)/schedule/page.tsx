import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import { ScheduleWeekView } from "@/components/schedule/schedule-week-view";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { findScheduleConflicts } from "@/features/schedule/conflicts";
import {
  filterScheduleEventsForMember,
  formatScheduleDuration,
  getScheduleDurationMinutes,
  resolveCalendarMember,
  resolveCalendarView,
} from "@/features/schedule/filters";
import { countUniqueScheduleEvents } from "@/features/schedule/metrics";
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
import { isFullAppEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

type SchedulePageProps = {
  searchParams?: Promise<{
    date?: string;
    member?: string;
    view?: string;
  }>;
};

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const params = await searchParams;
  const selectedDate = startOfDay(parseDateParam(params?.date));
  const view = resolveCalendarView(params?.view, isFullAppEnabled());
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  const rangeStartsAt =
    view === "week" ? startOfWeek(selectedDate) : selectedDate;
  const rangeEndsAt =
    view === "week" ? endOfWeek(selectedDate) : endOfDay(selectedDate);
  const events = await getScheduleEvents({
    endsAt: rangeEndsAt,
    familyId: context.family.id,
    startsAt: rangeStartsAt,
  });
  const activeMembers = context.members.filter(
    (member) => member.lifecycleStatus === "active",
  );
  const selectedMember = resolveCalendarMember(params?.member, activeMembers);
  const visibleEvents = filterScheduleEventsForMember(
    events,
    selectedMember?.id ?? null,
  );
  const conflicts = findScheduleConflicts(visibleEvents);
  const canManage = context.currentMember?.role === "parent";
  const defaultStartsAt = new Date(selectedDate);
  defaultStartsAt.setHours(16, 0, 0, 0);
  const defaultEndsAt = new Date(selectedDate);
  defaultEndsAt.setHours(17, 0, 0, 0);
  const eventCount = countUniqueScheduleEvents(visibleEvents);
  const duration = formatScheduleDuration(
    getScheduleDurationMinutes(visibleEvents),
  );
  const calendarOwner = selectedMember
    ? getPossessiveName(selectedMember.displayName)
    : getPossessiveName(context.family.name);
  const calendarPeriod = view === "week" ? "Weekly" : "Daily";

  return (
    <section className="grid gap-5">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusPill tone="info">Calendar</StatusPill>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              {calendarOwner} {calendarPeriod} Calendar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {view === "week"
                ? `${formatShortDate(rangeStartsAt)} - ${formatShortDate(rangeEndsAt)}`
                : formatDateHeading(selectedDate)}
              {selectedMember
                ? " · Includes events for this member and the whole family."
                : " · Everyone's plans in one place."}
            </p>
          </div>
          <div className="grid gap-3 lg:justify-items-end">
            <div className="rounded-xl border border-[var(--info)]/25 bg-[var(--info-soft)] px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--info)]">
              {eventCount} {eventCount === 1 ? "event" : "events"} · {duration}
            </div>
            <ScheduleControls
              date={selectedDate}
              memberId={selectedMember?.id ?? null}
              view={view}
            />
          </div>
        </div>
      </div>

      <CalendarMemberSelector
        date={selectedDate}
        members={activeMembers}
        selectedMemberId={selectedMember?.id ?? null}
        view={view}
      />

      {view === "week" ? (
        <ScheduleWeekView
          conflicts={conflicts}
          events={visibleEvents}
          members={context.members}
          weekStartsAt={rangeStartsAt}
        />
      ) : (
        <ScheduleBoard
          canManage={canManage}
          conflicts={conflicts}
          day={selectedDate}
          events={visibleEvents}
          familyId={context.family.id}
          members={context.members}
        />
      )}

      {canManage ? (
        <CreateScheduleEventForm
          defaultEndsAt={defaultEndsAt.toISOString()}
          defaultStartsAt={defaultStartsAt.toISOString()}
          familyId={context.family.id}
          members={context.members}
        />
      ) : null}
    </section>
  );
}

function CalendarMemberSelector({
  date,
  members,
  selectedMemberId,
  view,
}: {
  date: Date;
  members: FamilyMemberWithDetails[];
  selectedMemberId: string | null;
  view: "day" | "week";
}) {
  const linkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)]";
  const activeLinkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm";

  return (
    <nav aria-label="Calendar view" className="flex gap-2 overflow-x-auto pb-1">
      <Link
        className={selectedMemberId === null ? activeLinkClass : linkClass}
        href={getScheduleHref({ date, memberId: null, view })}
      >
        Whole family
      </Link>
      {members.map((member) => (
        <Link
          className={
            selectedMemberId === member.id ? activeLinkClass : linkClass
          }
          href={getScheduleHref({ date, memberId: member.id, view })}
          key={member.id}
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full border border-current"
            style={{ backgroundColor: member.color ?? "#047857" }}
          />
          {member.displayName}
        </Link>
      ))}
    </nav>
  );
}

function ScheduleControls({
  date,
  memberId,
  view,
}: {
  date: Date;
  memberId: string | null;
  view: "day" | "week";
}) {
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
          href={getScheduleHref({
            date: addDays(date, -step),
            memberId,
            view,
          })}
        >
          Previous
        </Link>
        <Link
          className={linkClass}
          href={getScheduleHref({ date: new Date(), memberId, view })}
        >
          Today
        </Link>
        <Link
          className={linkClass}
          href={getScheduleHref({
            date: addDays(date, step),
            memberId,
            view,
          })}
        >
          Next
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          className={view === "day" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "day" })}
        >
          Day
        </Link>
        <Link
          className={view === "week" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "week" })}
        >
          Week
        </Link>
      </div>
    </div>
  );
}

function getScheduleHref({
  date,
  memberId,
  view,
}: {
  date: Date;
  memberId: string | null;
  view: "day" | "week";
}) {
  const searchParams = new URLSearchParams({
    date: toDateParam(date),
    view,
  });

  if (memberId) {
    searchParams.set("member", memberId);
  }

  return `/schedule?${searchParams.toString()}`;
}

function getPossessiveName(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

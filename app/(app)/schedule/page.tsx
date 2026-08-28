import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarTimeZoneSync } from "@/components/schedule/calendar-time-zone-sync";
import { ScheduleActionToolbar } from "@/components/schedule/schedule-action-toolbar";
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
  dateTimeLocalToIso,
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
import {
  isValidTimeZone,
  startOfZonedDay,
  zonedDateKey,
} from "@/lib/dates/time-zone";

export const dynamic = "force-dynamic";

type SchedulePageProps = {
  searchParams?: Promise<{
    date?: string;
    member?: string;
    view?: string;
    timeZone?: string;
  }>;
};

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const params = await searchParams;
  const timeZone =
    params?.timeZone && isValidTimeZone(params.timeZone)
      ? params.timeZone
      : "UTC";
  const selectedDate = startOfDay(parseDateParam(params?.date));
  const view = resolveCalendarView(params?.view, isFullAppEnabled());
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    redirect("/family/setup");
  }

  const rangeStartsAt =
    view === "week" ? startOfWeek(selectedDate) : selectedDate;
  const rangeEndsAt =
    view === "week" ? endOfWeek(selectedDate) : endOfDay(selectedDate);
  const queryStartsAt = startOfZonedDay(toDateParam(rangeStartsAt), timeZone);
  const queryEndsAt = startOfZonedDay(
    toDateParam(addDays(rangeEndsAt, 1)),
    timeZone,
  );
  const events = await getScheduleEvents({
    endsAt: queryEndsAt,
    familyId: context.family.id,
    startsAt: queryStartsAt,
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
  const canManageAll = context.currentMember.role === "parent";
  const selectedDateKey = toDateParam(selectedDate);
  const defaultStartsAt = dateTimeLocalToIso(
    `${selectedDateKey}T16:00`,
    timeZone,
  );
  const defaultEndsAt = dateTimeLocalToIso(
    `${selectedDateKey}T17:00`,
    timeZone,
  );
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
      <CalendarTimeZoneSync timeZone={timeZone} />
      <div className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusPill tone="info">Calendar</StatusPill>
            <h1 className="mt-4 break-words text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
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
          <div className="grid min-w-0 gap-3 lg:justify-items-end">
            <div className="rounded-xl border border-[var(--info)]/25 bg-[var(--info-soft)] px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-[var(--info)] sm:px-4 sm:text-sm">
              {eventCount} {eventCount === 1 ? "event" : "events"} · {duration}
            </div>
            <ScheduleControls
              date={selectedDate}
              memberId={selectedMember?.id ?? null}
              view={view}
              timeZone={timeZone}
            />
            <ScheduleActionToolbar
              actorMemberId={context.currentMember.id}
              canManageAll={canManageAll}
              defaultEndsAt={defaultEndsAt}
              defaultStartsAt={defaultStartsAt}
              familyId={context.family.id}
              members={context.members}
              timeZone={timeZone}
            />
          </div>
        </div>
      </div>

      <CalendarMemberSelector
        date={selectedDate}
        members={activeMembers}
        selectedMemberId={selectedMember?.id ?? null}
        view={view}
        timeZone={timeZone}
      />

      {view === "week" ? (
        <ScheduleWeekView
          actorMemberId={context.currentMember.id}
          canManageAll={canManageAll}
          conflicts={conflicts}
          events={visibleEvents}
          familyId={context.family.id}
          members={context.members}
          timeZone={timeZone}
          weekStartsAt={rangeStartsAt}
        />
      ) : (
        <ScheduleBoard
          actorMemberId={context.currentMember.id}
          canManageAll={canManageAll}
          conflicts={conflicts}
          day={selectedDate}
          events={visibleEvents}
          familyId={context.family.id}
          members={context.members}
          timeZone={timeZone}
        />
      )}
    </section>
  );
}

function CalendarMemberSelector({
  date,
  members,
  selectedMemberId,
  view,
  timeZone,
}: {
  date: Date;
  members: FamilyMemberWithDetails[];
  selectedMemberId: string | null;
  view: "day" | "week";
  timeZone: string;
}) {
  const linkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)]";
  const activeLinkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm";

  return (
    <nav
      aria-label="Calendar view"
      className="flex max-w-full gap-2 overflow-x-auto pb-1"
    >
      <Link
        className={selectedMemberId === null ? activeLinkClass : linkClass}
        href={getScheduleHref({ date, memberId: null, view, timeZone })}
      >
        Whole family
      </Link>
      {members.map((member) => (
        <Link
          className={
            selectedMemberId === member.id ? activeLinkClass : linkClass
          }
          href={getScheduleHref({ date, memberId: member.id, view, timeZone })}
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
  timeZone,
}: {
  date: Date;
  memberId: string | null;
  view: "day" | "week";
  timeZone: string;
}) {
  const step = view === "week" ? 7 : 1;
  const today = parseDateParam(zonedDateKey(new Date(), timeZone));
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
            timeZone,
          })}
        >
          Previous
        </Link>
        <Link
          className={linkClass}
          href={getScheduleHref({ date: today, memberId, view, timeZone })}
        >
          Today
        </Link>
        <Link
          className={linkClass}
          href={getScheduleHref({
            date: addDays(date, step),
            memberId,
            view,
            timeZone,
          })}
        >
          Next
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          className={view === "day" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "day", timeZone })}
        >
          Day
        </Link>
        <Link
          className={view === "week" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "week", timeZone })}
        >
          Week
        </Link>
      </div>
      <form
        action="/schedule"
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        method="get"
      >
        <input name="view" type="hidden" value={view} />
        <input name="timeZone" type="hidden" value={timeZone} />
        {memberId ? (
          <input name="member" type="hidden" value={memberId} />
        ) : null}
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--muted)]">
          Jump to date
          <input
            className="min-h-10 min-w-0 rounded-md border border-[var(--line)] px-2 text-sm text-[var(--foreground)]"
            defaultValue={toDateParam(date)}
            name="date"
            type="date"
          />
        </label>
        <button className={linkClass} type="submit">
          Go
        </button>
      </form>
    </div>
  );
}

function getScheduleHref({
  date,
  memberId,
  view,
  timeZone,
}: {
  date: Date;
  memberId: string | null;
  view: "day" | "week";
  timeZone: string;
}) {
  const searchParams = new URLSearchParams({
    date: toDateParam(date),
    view,
    timeZone,
  });

  if (memberId) {
    searchParams.set("member", memberId);
  }

  return `/schedule?${searchParams.toString()}`;
}

function getPossessiveName(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

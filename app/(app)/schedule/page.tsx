import { redirect } from "next/navigation";
import { CalendarTimeZoneSync } from "@/components/schedule/calendar-time-zone-sync";
import { ScheduleActionToolbar } from "@/components/schedule/schedule-action-toolbar";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import {
  CalendarDateNavigation,
  CalendarMemberFilter,
  ScheduleViewControls,
} from "@/components/schedule/schedule-navigation";
import { ScheduleWeekView } from "@/components/schedule/schedule-week-view";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
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
  addCalendarDays,
  dateTimeLocalToIso,
  endOfCalendarWeek,
  formatCalendarDateHeading,
  formatCalendarShortDate,
  resolveCalendarDate,
  startOfCalendarWeek,
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
  const today = zonedDateKey(new Date(), timeZone);
  const selectedDate = resolveCalendarDate(params?.date, today);
  const view = resolveCalendarView(params?.view, isFullAppEnabled());
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    redirect("/family/setup");
  }

  const rangeStartsAt =
    view === "week" ? startOfCalendarWeek(selectedDate) : selectedDate;
  const rangeEndsAt =
    view === "week" ? endOfCalendarWeek(selectedDate) : selectedDate;
  const queryStartsAt = startOfZonedDay(rangeStartsAt, timeZone);
  const queryEndsAt = startOfZonedDay(
    addCalendarDays(rangeEndsAt, 1),
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
  const defaultStartsAt = dateTimeLocalToIso(`${selectedDate}T16:00`, timeZone);
  const defaultEndsAt = dateTimeLocalToIso(`${selectedDate}T17:00`, timeZone);
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
                ? `${formatCalendarShortDate(rangeStartsAt)} - ${formatCalendarShortDate(rangeEndsAt)}`
                : formatCalendarDateHeading(selectedDate)}
              {selectedMember
                ? " · Includes events for this member and the whole family."
                : " · Everyone's plans in one place."}
            </p>
          </div>
          <div className="grid min-w-0 gap-3 lg:justify-items-end">
            <div className="rounded-xl border border-[var(--info)]/25 bg-[var(--info-soft)] px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-[var(--info)] sm:px-4 sm:text-sm">
              {eventCount} {eventCount === 1 ? "event" : "events"} · {duration}
            </div>
            <ScheduleViewControls
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

      <CalendarMemberFilter
        date={selectedDate}
        members={activeMembers}
        selectedMemberId={selectedMember?.id ?? null}
        view={view}
        timeZone={timeZone}
      />

      <div className="grid gap-2" data-testid="calendar-with-navigation">
        <CalendarDateNavigation
          date={selectedDate}
          memberId={selectedMember?.id ?? null}
          timeZone={timeZone}
          today={today}
          view={view}
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
            weekStartsOn={rangeStartsAt}
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
      </div>
    </section>
  );
}

function getPossessiveName(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

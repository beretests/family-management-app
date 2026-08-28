"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { ScheduleEventModal } from "@/components/schedule/schedule-event-modal";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import {
  calendarHourHeight,
  getCalendarHourRange,
  layoutCalendarEventsForDay,
} from "@/features/schedule/calendar-layout";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import {
  addDays,
  formatShortDate,
  formatTimeRange,
  formatWeekday,
  toDateParam,
} from "@/lib/dates/schedule";
import { dateTimeLocalToUtc } from "@/lib/dates/time-zone";

const wholeFamilyColor = "#64748b";

export function ScheduleTimeGrid({
  actorMemberId = "",
  canManageAll = false,
  conflicts,
  days,
  events,
  familyId = "",
  members,
  timeZone = "UTC",
}: {
  actorMemberId?: string;
  canManageAll?: boolean;
  conflicts: Map<string, string[]>;
  days: Date[];
  events: ScheduleEvent[];
  familyId?: string;
  members: FamilyMemberWithDetails[];
  timeZone?: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const { endHour, startHour } = getCalendarHourRange(events, timeZone);
  const hourCount = endHour - startHour;
  const gridHeight = hourCount * calendarHourHeight;
  const timeBands = Array.from(
    { length: Math.ceil(hourCount / 2) },
    (_, index) => ({
      startsAt: startHour + index * 2,
      endsAt: Math.min(endHour, startHour + index * 2 + 2),
    }),
  );
  const isWeek = days.length > 1;
  const gridColumns = isWeek
    ? `4rem repeat(${days.length}, minmax(7.5rem, 1fr))`
    : "3.5rem minmax(0, 1fr)";
  const allDayEvents = events.filter((event) => event.allDay);

  return (
    <section aria-label={isWeek ? "Weekly calendar" : "Daily calendar"}>
      <div className="md:hidden">
        <ScheduleMobileAgenda
          conflicts={conflicts}
          days={days}
          events={events}
          members={members}
          onSelect={setSelectedEventId}
          timeZone={timeZone}
        />
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-[var(--line)] bg-white shadow-sm md:block">
        <div
          className={isWeek ? "min-w-[58rem]" : "min-w-0"}
          data-testid="schedule-time-grid"
        >
          <div
            className="grid border-b border-[var(--line)] bg-[#eaf1f8]"
            style={{ gridTemplateColumns: gridColumns }}
          >
            <div className="flex items-center justify-center border-r border-[var(--line)] px-2 py-4 text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
              Time
            </div>
            {days.map((day) => (
              <div
                className={`border-r border-[var(--line)] px-3 py-3 text-center last:border-r-0 ${
                  isWeekend(day) ? "bg-[#f0eef9]" : ""
                }`}
                key={day.toISOString()}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                  {formatWeekday(day)}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--accent-strong)]">
                  {formatShortDate(day)}
                </p>
              </div>
            ))}
          </div>

          {allDayEvents.length > 0 ? (
            <div
              className="grid border-b border-[var(--line)] bg-[#f8fafc]"
              style={{ gridTemplateColumns: gridColumns }}
            >
              <div className="flex items-start justify-end border-r border-[var(--line)] px-2 py-3 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--muted)]">
                All day
              </div>
              {days.map((day) => (
                <div
                  className={`grid content-start gap-1 border-r border-[var(--line)] p-1.5 last:border-r-0 ${
                    isWeekend(day) ? "bg-[#f7f5fc]" : ""
                  }`}
                  key={day.toISOString()}
                >
                  {eventsForDay(allDayEvents, day, timeZone).map((event) => (
                    <AllDayEventCard
                      conflict={conflicts.has(event.id)}
                      event={event}
                      key={event.id}
                      members={members}
                      onSelect={() => setSelectedEventId(event.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid" style={{ gridTemplateColumns: gridColumns }}>
            <div
              aria-hidden="true"
              className="relative border-r border-[var(--line)] bg-[#f7fafc]"
              style={{ height: gridHeight }}
            >
              {timeBands.map((band) => (
                <span
                  className="absolute left-1 right-1 -translate-y-1/2 text-center text-[0.6rem] font-semibold text-[var(--muted)]"
                  key={band.startsAt}
                  style={{
                    top:
                      (band.startsAt -
                        startHour +
                        (band.endsAt - band.startsAt) / 2) *
                      calendarHourHeight,
                  }}
                >
                  {formatTimeBand(band.startsAt, band.endsAt)}
                </span>
              ))}
            </div>

            {days.map((day) => {
              const dayAllDayEvents = eventsForDay(allDayEvents, day, timeZone);
              const layouts = layoutCalendarEventsForDay({
                day,
                endHour,
                events,
                startHour,
                timeZone,
              });

              return (
                <div
                  className={`relative overflow-hidden border-r border-[var(--line)] last:border-r-0 ${
                    isWeekend(day) ? "bg-[#fbfaff]" : "bg-white"
                  }`}
                  key={day.toISOString()}
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, transparent calc(100% - 1px), var(--line) 0)",
                    backgroundSize: `100% ${calendarHourHeight}px`,
                    height: gridHeight,
                  }}
                >
                  {dayAllDayEvents.length > 0 ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0"
                      data-testid={`all-day-coverage-${toDateParam(day)}`}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${getEventColor(dayAllDayEvents[0], members)} 9%, transparent)`,
                        boxShadow: `inset 5px 0 0 color-mix(in srgb, ${getEventColor(dayAllDayEvents[0], members)} 42%, transparent)`,
                      }}
                    />
                  ) : null}
                  {layouts.map((layout) => (
                    <TimedEventCard
                      conflict={conflicts.has(layout.event.id)}
                      height={layout.height}
                      event={layout.event}
                      key={layout.event.id}
                      members={members}
                      onSelect={() => setSelectedEventId(layout.event.id)}
                      timeZone={timeZone}
                      style={{
                        top: layout.top + 2,
                        height: Math.max(8, layout.height - 4),
                        left: `calc(${layout.left}% + 3px)`,
                        width: `calc(${layout.width}% - 6px)`,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ScheduleColorKey members={members} />

      {selectedEvent ? (
        <ScheduleEventModal
          actorMemberId={actorMemberId}
          canManageAll={canManageAll}
          conflicts={conflicts.get(selectedEvent.id) ?? []}
          event={selectedEvent}
          familyId={familyId || selectedEvent.familyId}
          members={members}
          onClose={() => setSelectedEventId(null)}
          timeZone={timeZone}
        />
      ) : null}
    </section>
  );
}

function ScheduleMobileAgenda({
  conflicts,
  days,
  events,
  members,
  onSelect,
  timeZone,
}: {
  conflicts: Map<string, string[]>;
  days: Date[];
  events: ScheduleEvent[];
  members: FamilyMemberWithDetails[];
  onSelect: (eventId: string) => void;
  timeZone: string;
}) {
  return (
    <div className="grid gap-3" data-testid="schedule-mobile-agenda">
      {days.map((day) => {
        const dayEvents = eventsForDay(events, day, timeZone).sort(
          (left, right) =>
            Number(right.allDay) - Number(left.allDay) ||
            new Date(left.startsAt).getTime() -
              new Date(right.startsAt).getTime(),
        );

        return (
          <section
            className="min-w-0 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm"
            key={day.toISOString()}
          >
            <header
              className={`border-b border-[var(--line)] px-4 py-3 ${
                isWeekend(day) ? "bg-[#f0eef9]" : "bg-[#eaf1f8]"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                {formatWeekday(day)}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--accent-strong)]">
                {formatShortDate(day)}
              </p>
            </header>
            <div className="grid gap-2 p-3">
              {dayEvents.length === 0 ? (
                <p className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
                  Nothing scheduled.
                </p>
              ) : null}
              {dayEvents.map((event) => {
                const color = getEventColor(event, members);
                const attendeeLabel = getAttendeeLabel(event, members);
                const conflict = conflicts.has(event.id);

                return (
                  <button
                    aria-label={`${event.title}, ${formatTimeRange(event.startsAt, event.endsAt, event.allDay, timeZone)}, ${attendeeLabel}`}
                    className="min-w-0 rounded-lg border px-3 py-3 text-left shadow-sm transition hover:shadow-md"
                    key={event.id}
                    onClick={() => onSelect(event.id)}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} ${event.allDay ? 14 : 8}%, white)`,
                      borderColor: `color-mix(in srgb, ${color} 45%, white)`,
                      boxShadow: `inset 5px 0 0 ${color}`,
                    }}
                    type="button"
                  >
                    <span className="flex min-w-0 items-start justify-between gap-2 pl-1">
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-bold text-[var(--foreground)]">
                          {event.title}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-[var(--accent-strong)]">
                          {formatTimeRange(
                            event.startsAt,
                            event.endsAt,
                            event.allDay,
                            timeZone,
                          )}
                        </span>
                        <span className="mt-1 block break-words text-xs text-[var(--muted)]">
                          {attendeeLabel} ·{" "}
                          {scheduleEventTypeLabels[event.eventType]}
                        </span>
                      </span>
                      {conflict ? (
                        <span className="shrink-0 rounded bg-[var(--warning-soft)] px-2 py-1 text-[0.65rem] font-bold uppercase text-[var(--warning)]">
                          Conflict
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TimedEventCard({
  conflict,
  event,
  height,
  members,
  onSelect,
  style,
  timeZone,
}: {
  conflict: boolean;
  event: ScheduleEvent;
  height: number;
  members: FamilyMemberWithDetails[];
  onSelect: () => void;
  style: CSSProperties;
  timeZone: string;
}) {
  const color = getEventColor(event, members);
  const attendeeLabel = getAttendeeLabel(event, members);
  const secondaryDetails = [event.location, event.description]
    .filter(Boolean)
    .join(" · ");
  const participantDetails = `${attendeeLabel} · ${scheduleEventTypeLabels[event.eventType]}`;

  return (
    <button
      aria-label={`${event.title}, ${formatTimeRange(event.startsAt, event.endsAt, false, timeZone)}, ${attendeeLabel}`}
      className="absolute z-10 cursor-pointer overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition hover:z-20 hover:shadow-md focus-visible:z-30"
      onClick={onSelect}
      style={{
        ...style,
        backgroundColor: `color-mix(in srgb, ${color} 10%, white)`,
        borderColor: `color-mix(in srgb, ${color} 45%, white)`,
        boxShadow: `inset 5px 0 0 ${color}`,
      }}
      type="button"
    >
      <div className="flex items-start justify-between gap-1 pl-1">
        <p className="truncate text-xs font-bold leading-4 text-[var(--foreground)]">
          {event.title}
        </p>
        {conflict ? (
          <span className="shrink-0 rounded bg-[var(--warning-soft)] px-1 text-[0.6rem] font-bold uppercase text-[var(--warning)]">
            Conflict
          </span>
        ) : null}
      </div>
      <p className="truncate pl-1 text-[0.65rem] font-semibold leading-3.5 text-[var(--accent-strong)]">
        {formatTimeRange(event.startsAt, event.endsAt, false, timeZone)}
      </p>
      {height >= 48 ? (
        <p className="truncate pl-1 text-[0.62rem] leading-3.5 text-[var(--muted)]">
          {secondaryDetails || participantDetails}
        </p>
      ) : null}
      {height >= 76 && secondaryDetails ? (
        <p className="truncate pl-1 text-[0.62rem] leading-3.5 text-[var(--muted)]">
          {participantDetails}
        </p>
      ) : null}
    </button>
  );
}

function AllDayEventCard({
  conflict,
  event,
  members,
  onSelect,
}: {
  conflict: boolean;
  event: ScheduleEvent;
  members: FamilyMemberWithDetails[];
  onSelect: () => void;
}) {
  const color = getEventColor(event, members);

  return (
    <button
      aria-label={`${event.title}, all day, ${getAttendeeLabel(event, members)}`}
      className="min-h-10 w-full cursor-pointer truncate rounded-md border px-2 py-1 text-left text-[0.65rem] font-semibold text-[var(--foreground)] transition hover:brightness-95"
      onClick={onSelect}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 10%, white)`,
        borderColor: color,
      }}
      type="button"
    >
      {event.title}
      {conflict ? " · Conflict" : ""}
    </button>
  );
}

function ScheduleColorKey({ members }: { members: FamilyMemberWithDetails[] }) {
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus === "active",
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
      <span className="text-[var(--foreground)]">Family colour key</span>
      <ColorKeyItem color={wholeFamilyColor} label="Whole family" />
      {activeMembers.map((member) => (
        <ColorKeyItem
          color={member.color ?? "#047857"}
          key={member.id}
          label={`${member.displayName}${getStatusSuffix(member)}`}
        />
      ))}
    </div>
  );
}

function ColorKeyItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function eventsForDay(events: ScheduleEvent[], day: Date, timeZone: string) {
  const dayStart = dateTimeLocalToUtc(
    `${toDateParam(day)}T00:00`,
    timeZone,
  ).getTime();
  const nextDayStart = dateTimeLocalToUtc(
    `${toDateParam(addDays(day, 1))}T00:00`,
    timeZone,
  ).getTime();

  return events.filter((event) => {
    const startsAt = new Date(event.startsAt).getTime();
    const endsAt = new Date(event.endsAt).getTime();

    return startsAt < nextDayStart && endsAt > dayStart;
  });
}

function getEventColor(
  event: ScheduleEvent,
  members: FamilyMemberWithDetails[],
) {
  const firstAttendee = members.find((member) =>
    event.memberIds.includes(member.id),
  );

  return event.color ?? firstAttendee?.color ?? wholeFamilyColor;
}

function getAttendeeLabel(
  event: ScheduleEvent,
  members: FamilyMemberWithDetails[],
) {
  const attendeeNames = members
    .filter((member) => event.memberIds.includes(member.id))
    .map((member) => member.displayName);

  return attendeeNames.length > 0 ? attendeeNames.join(", ") : "Whole family";
}

function getStatusSuffix(member: FamilyMemberWithDetails) {
  const status = member.currentStatus?.status ?? "normal";

  return status === "normal" ? "" : ` · ${status.replaceAll("_", " ")}`;
}

function isWeekend(day: Date) {
  return day.getDay() === 0 || day.getDay() === 6;
}

function formatTimeBand(startsAt: number, endsAt: number) {
  const start = getHourParts(startsAt);
  const end = getHourParts(endsAt);

  if (start.period === end.period) {
    return `${start.hour}-${end.hour} ${end.period}`;
  }

  return `${start.hour} ${start.period}-${end.hour} ${end.period}`;
}

function getHourParts(hour: number) {
  const normalizedHour = hour % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const displayHour = normalizedHour % 12 || 12;

  return { hour: displayHour, period };
}

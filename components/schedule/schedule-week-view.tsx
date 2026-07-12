import { StatusPill } from "@/components/ui/status-pill";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import {
  addDays,
  formatShortDate,
  formatTimeRange,
  formatWeekday,
  startOfDay,
} from "@/lib/dates/schedule";

export function ScheduleWeekView({
  conflicts,
  events,
  members,
  weekStartsAt,
}: {
  conflicts: Map<string, string[]>;
  events: ScheduleEvent[];
  members: FamilyMemberWithDetails[];
  weekStartsAt: Date;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    startOfDay(addDays(weekStartsAt, index)),
  );

  return (
    <section className="grid gap-3 lg:grid-cols-7">
      {days.map((day) => (
        <article
          className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-sm"
          key={day.toISOString()}
        >
          <h2 className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
            {formatWeekday(day)}
          </h2>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {formatShortDate(day)}
          </p>
          <div className="mt-3 grid gap-2">
            {eventsForDay(events, day).length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
                Open
              </p>
            ) : null}
            {eventsForDay(events, day).map((event) => (
              <WeekEventCard
                conflict={conflicts.has(event.id)}
                event={event}
                key={event.id}
                member={members.find((item) => item.id === event.memberId)}
              />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function eventsForDay(events: ScheduleEvent[], day: Date) {
  const dayStart = startOfDay(day).getTime();
  const nextDayStart = addDays(startOfDay(day), 1).getTime();

  return events.filter((event) => {
    const startsAt = new Date(event.startsAt).getTime();
    const endsAt = new Date(event.endsAt).getTime();

    return startsAt < nextDayStart && endsAt > dayStart;
  });
}

function WeekEventCard({
  conflict,
  event,
  member,
}: {
  conflict: boolean;
  event: ScheduleEvent;
  member?: FamilyMemberWithDetails;
}) {
  const color = event.color ?? member?.color ?? "#047857";

  return (
    <div
      className="rounded-md border border-[var(--line)] bg-white p-3"
      style={{ borderLeft: `5px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {event.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatTimeRange(event.startsAt, event.endsAt, event.allDay)}
          </p>
        </div>
        {conflict ? <StatusPill tone="warning">!</StatusPill> : null}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {member?.displayName ?? "Whole family"} ·{" "}
        {scheduleEventTypeLabels[event.eventType]}
      </p>
    </div>
  );
}

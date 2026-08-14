import { EditScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import { StatusPill } from "@/components/ui/status-pill";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import { formatTimeRange, startOfDay } from "@/lib/dates/schedule";

export function ScheduleBoard({
  canManage,
  conflicts,
  day,
  events,
  familyId,
  members,
}: {
  canManage: boolean;
  conflicts: Map<string, string[]>;
  day: Date;
  events: ScheduleEvent[];
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const sortedEvents = [...events].sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

  return (
    <div className="grid gap-5">
      <ScheduleTimeGrid
        conflicts={conflicts}
        days={[startOfDay(day)]}
        events={events}
        members={members}
      />

      <section
        aria-labelledby="event-details-heading"
        className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
      >
        <div>
          <h2
            className="text-lg font-semibold text-[var(--foreground)]"
            id="event-details-heading"
          >
            Event details
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Review notes and locations{canManage ? ", or edit an event" : ""}.
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {sortedEvents.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] lg:col-span-2">
              Nothing scheduled.
            </p>
          ) : null}
          {sortedEvents.map((event) => (
            <ScheduleEventCard
              canManage={canManage}
              conflicts={conflicts.get(event.id) ?? []}
              event={event}
              familyId={familyId}
              key={event.id}
              members={members}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ScheduleEventCard({
  canManage,
  conflicts,
  event,
  familyId,
  members,
}: {
  canManage: boolean;
  conflicts: string[];
  event: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const attendees = members.filter((member) =>
    event.memberIds.includes(member.id),
  );
  const color = event.color ?? attendees[0]?.color ?? "#64748b";
  const attendeeLabel =
    attendees.length > 0
      ? attendees.map((member) => member.displayName).join(", ")
      : "Whole family";

  return (
    <article
      className="rounded-lg border border-[var(--line)] bg-white p-4"
      style={{ boxShadow: `inset 6px 0 0 ${color}` }}
    >
      <div className="flex items-start justify-between gap-2 pl-1">
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatTimeRange(event.startsAt, event.endsAt, event.allDay)} ·{" "}
            {scheduleEventTypeLabels[event.eventType]}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{attendeeLabel}</p>
          {event.location ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {event.description}
            </p>
          ) : null}
        </div>
        {conflicts.length > 0 ? (
          <StatusPill tone="warning">Conflict</StatusPill>
        ) : null}
      </div>

      {canManage ? (
        <details className="mt-3 rounded-md border border-[var(--line)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
            Edit
          </summary>
          <EditScheduleEventForm
            event={event}
            familyId={familyId}
            members={members}
          />
        </details>
      ) : null}
    </article>
  );
}

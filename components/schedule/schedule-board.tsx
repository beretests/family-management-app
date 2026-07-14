import { EditScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { StatusPill } from "@/components/ui/status-pill";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import { formatTimeRange } from "@/lib/dates/schedule";

export function ScheduleBoard({
  canManage,
  conflicts,
  events,
  familyId,
  members,
}: {
  canManage: boolean;
  conflicts: Map<string, string[]>;
  events: ScheduleEvent[];
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus === "active",
  );
  const wholeFamilyEvents = events.filter((event) => event.memberIds.length === 0);

  return (
    <section className="grid gap-4">
      <ScheduleLane
        canManage={canManage}
        conflicts={conflicts}
        events={wholeFamilyEvents}
        familyId={familyId}
        members={members}
        title="Whole family"
      />
      {activeMembers.map((member) => (
        <ScheduleLane
          canManage={canManage}
          color={member.color ?? "#047857"}
          conflicts={conflicts}
          events={events.filter((event) => event.memberIds.includes(member.id))}
          familyId={familyId}
          key={member.id}
          member={member}
          members={members}
          title={member.displayName}
        />
      ))}
    </section>
  );
}

function ScheduleLane({
  canManage,
  color = "#64748b",
  conflicts,
  events,
  familyId,
  member,
  members,
  title,
}: {
  canManage: boolean;
  color?: string;
  conflicts: Map<string, string[]>;
  events: ScheduleEvent[];
  familyId: string;
  member?: FamilyMemberWithDetails;
  members: FamilyMemberWithDetails[];
  title: string;
}) {
  const status = member?.currentStatus?.status ?? "normal";
  const memberContext = member ? getMemberContextLabel(member) : null;

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="size-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h2>
            {memberContext ? (
              <p className="text-sm text-[var(--muted)]">{memberContext}</p>
            ) : null}
          </div>
        </div>
        {member && status !== "normal" ? (
          <StatusPill tone="warning">{status.replaceAll("_", " ")}</StatusPill>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {events.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            Nothing scheduled.
          </p>
        ) : null}
        {events.map((event) => (
          <ScheduleEventCard
            canManage={canManage}
            conflicts={conflicts.get(event.id) ?? []}
            event={event}
            familyId={familyId}
            key={event.id}
            memberColor={member?.color ?? null}
            members={members}
          />
        ))}
      </div>
    </article>
  );
}

function getMemberContextLabel(member: FamilyMemberWithDetails) {
  if (member.role === "child") {
    return `Age ${member.ageYears ?? "unknown"} · ability ${member.abilityLevel}/5`;
  }

  if (member.role === "caregiver") {
    return "Caregiver";
  }

  return "Parent";
}

function ScheduleEventCard({
  canManage,
  conflicts,
  event,
  familyId,
  memberColor,
  members,
}: {
  canManage: boolean;
  conflicts: string[];
  event: ScheduleEvent;
  familyId: string;
  memberColor: string | null;
  members: FamilyMemberWithDetails[];
}) {
  const color = event.color ?? memberColor ?? "#047857";
  const attendeeNames = members
    .filter((member) => event.memberIds.includes(member.id))
    .map((member) => member.displayName);

  return (
    <article
      className="rounded-md border border-[var(--line)] p-4"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatTimeRange(event.startsAt, event.endsAt, event.allDay)} ·{" "}
            {scheduleEventTypeLabels[event.eventType]}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {attendeeNames.length > 0 ? attendeeNames.join(", ") : "Whole family"}
          </p>
          {event.location ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {event.location}
            </p>
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

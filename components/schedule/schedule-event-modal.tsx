import { EditScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import { formatTimeRange } from "@/lib/dates/schedule";

export function ScheduleEventModal({
  actorMemberId,
  canManageAll,
  conflicts,
  event,
  familyId,
  members,
  onClose,
  timeZone,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  conflicts: string[];
  event: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
  onClose: () => void;
  timeZone: string;
}) {
  const attendees = members.filter((member) =>
    event.memberIds.includes(member.id),
  );
  const attendeeLabel =
    attendees.length > 0
      ? attendees.map((member) => member.displayName).join(", ")
      : "Whole family";
  const canEdit = canManageAll || event.createdByMemberId === actorMemberId;

  return (
    <Modal
      closeLabel="Close event details"
      eyebrow="Event details"
      onClose={onClose}
      title={event.title}
    >
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-lg bg-[#f7fafc] p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">
              {scheduleEventTypeLabels[event.eventType]}
            </StatusPill>
            {conflicts.length > 0 ? (
              <StatusPill tone="warning">Conflict</StatusPill>
            ) : null}
            {event.recurrence ? (
              <StatusPill tone="info">
                Repeats {event.recurrence.frequency}
              </StatusPill>
            ) : null}
          </div>
          <p className="font-semibold">
            {formatTimeRange(
              event.startsAt,
              event.endsAt,
              event.allDay,
              timeZone,
            )}
          </p>
          <p className="break-words text-[var(--muted)]">{attendeeLabel}</p>
          {event.location ? (
            <p className="break-words text-[var(--muted)]">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="whitespace-pre-wrap break-words leading-6">
              {event.description}
            </p>
          ) : null}
        </div>

        {canEdit ? (
          <details className="rounded-lg border border-[var(--line)] p-3 sm:p-4">
            <summary className="min-h-11 cursor-pointer content-center font-bold">
              Edit event
            </summary>
            <EditScheduleEventForm
              actorMemberId={actorMemberId}
              canDelete={canManageAll}
              canManageAll={canManageAll}
              event={event}
              familyId={familyId}
              members={members}
              timeZone={timeZone}
            />
          </details>
        ) : null}
      </div>
    </Modal>
  );
}

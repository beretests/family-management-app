import type { ScheduleEvent } from "@/features/schedule/types";

type ConflictCandidate = Pick<
  ScheduleEvent,
  "id" | "memberId" | "memberIds" | "startsAt" | "endsAt"
>;

export function eventsOverlap(
  first: Pick<ScheduleEvent, "startsAt" | "endsAt">,
  second: Pick<ScheduleEvent, "startsAt" | "endsAt">,
) {
  return (
    new Date(first.startsAt).getTime() < new Date(second.endsAt).getTime() &&
    new Date(second.startsAt).getTime() < new Date(first.endsAt).getTime()
  );
}

export function findScheduleConflicts(events: ConflictCandidate[]) {
  const conflicts = new Map<string, Set<string>>();
  const memberEvents = events.filter((event) => event.memberIds.length > 0);

  for (let index = 0; index < memberEvents.length; index += 1) {
    const current = memberEvents[index];

    for (let nextIndex = index + 1; nextIndex < memberEvents.length; nextIndex += 1) {
      const next = memberEvents[nextIndex];
      const sharesMember = current.memberIds.some((memberId) =>
        next.memberIds.includes(memberId),
      );

      if (!sharesMember || !eventsOverlap(current, next)) {
        continue;
      }

      if (!conflicts.has(current.id)) {
        conflicts.set(current.id, new Set());
      }

      if (!conflicts.has(next.id)) {
        conflicts.set(next.id, new Set());
      }

      conflicts.get(current.id)?.add(next.id);
      conflicts.get(next.id)?.add(current.id);
    }
  }

  return new Map(
    Array.from(conflicts.entries()).map(([eventId, conflictingEventIds]) => [
      eventId,
      Array.from(conflictingEventIds),
    ]),
  );
}

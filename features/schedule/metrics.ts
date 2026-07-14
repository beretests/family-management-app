import type { ScheduleEvent } from "@/features/schedule/types";

export function countUniqueScheduleEvents(events: Pick<ScheduleEvent, "id">[]) {
  return new Set(events.map((event) => event.id)).size;
}

import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { addDays, startOfDay } from "@/lib/dates/schedule";

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
    <ScheduleTimeGrid
      conflicts={conflicts}
      days={days}
      events={events}
      members={members}
    />
  );
}

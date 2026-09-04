import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { addCalendarDays } from "@/lib/dates/schedule";

export function ScheduleWeekView({
  conflicts,
  events,
  members,
  actorMemberId,
  canManageAll,
  familyId,
  timeZone,
  weekStartsOn,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  conflicts: Map<string, string[]>;
  events: ScheduleEvent[];
  familyId: string;
  members: FamilyMemberWithDetails[];
  timeZone: string;
  weekStartsOn: string;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addCalendarDays(weekStartsOn, index),
  );

  return (
    <ScheduleTimeGrid
      actorMemberId={actorMemberId}
      canManageAll={canManageAll}
      conflicts={conflicts}
      days={days}
      events={events}
      familyId={familyId}
      members={members}
      timeZone={timeZone}
    />
  );
}

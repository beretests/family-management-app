import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { startOfDay } from "@/lib/dates/schedule";

export function ScheduleBoard({
  actorMemberId,
  canManageAll,
  conflicts,
  day,
  events,
  familyId,
  members,
  timeZone,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  conflicts: Map<string, string[]>;
  day: Date;
  events: ScheduleEvent[];
  familyId: string;
  members: FamilyMemberWithDetails[];
  timeZone: string;
}) {
  return (
    <ScheduleTimeGrid
      actorMemberId={actorMemberId}
      canManageAll={canManageAll}
      conflicts={conflicts}
      days={[startOfDay(day)]}
      events={events}
      familyId={familyId}
      members={members}
      timeZone={timeZone}
    />
  );
}

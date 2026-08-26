import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import { ScheduleEventDetails } from "@/components/schedule/schedule-board";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { addDays, startOfDay } from "@/lib/dates/schedule";

export function ScheduleWeekView({
  conflicts,
  events,
  members,
  actorMemberId,
  canManageAll,
  familyId,
  timeZone,
  weekStartsAt,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  conflicts: Map<string, string[]>;
  events: ScheduleEvent[];
  familyId: string;
  members: FamilyMemberWithDetails[];
  timeZone: string;
  weekStartsAt: Date;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    startOfDay(addDays(weekStartsAt, index)),
  );

  return (
    <div className="grid gap-5">
      <ScheduleTimeGrid
        conflicts={conflicts}
        days={days}
        events={events}
        members={members}
        timeZone={timeZone}
      />
      <ScheduleEventDetails
        actorMemberId={actorMemberId}
        canManageAll={canManageAll}
        conflicts={conflicts}
        events={events}
        familyId={familyId}
        members={members}
        timeZone={timeZone}
      />
    </div>
  );
}

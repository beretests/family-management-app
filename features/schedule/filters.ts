import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";

export const wholeFamilyCalendarValue = "family";
export type CalendarView = "day" | "week";

export function resolveCalendarView(
  value: string | undefined,
  fullAppEnabled: boolean,
): CalendarView {
  if (value === "day" || value === "week") {
    return value;
  }

  return fullAppEnabled ? "day" : "week";
}

export function resolveCalendarMember(
  value: string | undefined,
  members: FamilyMemberWithDetails[],
) {
  if (!value || value === wholeFamilyCalendarValue) {
    return null;
  }

  return (
    members.find(
      (member) => member.id === value && member.lifecycleStatus === "active",
    ) ?? null
  );
}

export function filterScheduleEventsForMember(
  events: ScheduleEvent[],
  memberId: string | null,
) {
  if (!memberId) {
    return events;
  }

  return events.filter(
    (event) =>
      event.memberIds.length === 0 || event.memberIds.includes(memberId),
  );
}

export function getScheduleDurationMinutes(events: ScheduleEvent[]) {
  return events.reduce((total, event) => {
    if (event.allDay) {
      return total;
    }

    const startsAt = new Date(event.startsAt).getTime();
    const endsAt = new Date(event.endsAt).getTime();

    if (Number.isNaN(startsAt) || Number.isNaN(endsAt) || endsAt <= startsAt) {
      return total;
    }

    return total + Math.round((endsAt - startsAt) / 60_000);
  }, 0);
}

export function formatScheduleDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

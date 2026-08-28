import type { ScheduleEventType } from "@/features/schedule/types";

export const scheduleEventTypeLabels: Record<ScheduleEventType, string> = {
  school: "School",
  no_school: "No School",
  extracurricular: "Extracurricular",
  appointment: "Appointment",
  family_event: "Family event",
  rest_sick: "Rest or sick",
  parent_work: "Parent work",
  parent_away: "Parent away",
  parent_activity: "Parent activity",
  chore_task: "Chore task",
};

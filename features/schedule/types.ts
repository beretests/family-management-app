export type ScheduleEventType =
  | "school"
  | "extracurricular"
  | "appointment"
  | "family_event"
  | "rest_sick"
  | "parent_work"
  | "parent_away"
  | "parent_activity"
  | "chore_task";

export type ScheduleEvent = {
  id: string;
  familyId: string;
  memberId: string | null;
  memberIds: string[];
  taskInstanceId: string | null;
  createdByMemberId: string | null;
  eventType: ScheduleEventType;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleMember = {
  id: string;
  displayName: string;
  role: "parent" | "caregiver" | "child";
  color: string | null;
  status: "normal" | "under_the_weather" | "sick" | "rest_day";
};

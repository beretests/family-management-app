export type ScheduleEventType =
  | "school"
  | "no_school"
  | "extracurricular"
  | "appointment"
  | "family_event"
  | "rest_sick"
  | "parent_work"
  | "parent_away"
  | "parent_activity"
  | "chore_task";

export type ScheduleRecurrenceFrequency = "daily" | "weekly" | "yearly";

export type ScheduleRecurrence = {
  frequency: ScheduleRecurrenceFrequency;
  interval: number;
  weekdays: number[];
  endsOn: string | null;
  occurrenceCount: number | null;
  timeZone: string;
};

export type ScheduleEventEditScope = "occurrence" | "following" | "series";

export type ScheduleOccurrenceOverride = {
  id: string;
  occurrenceDate: string;
  status: "modified" | "cancelled";
  memberIds: string[];
  eventType: ScheduleEventType | null;
  title: string | null;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean | null;
  location: string | null;
  color: string | null;
  updatedAt: string;
};

export type ScheduleEvent = {
  id: string;
  sourceEventId?: string;
  occurrenceDate?: string;
  occurrenceOverrideId?: string;
  seriesStartsAt?: string;
  seriesEndsAt?: string;
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
  recurrence?: ScheduleRecurrence | null;
};

export type ScheduleMember = {
  id: string;
  displayName: string;
  role: "parent" | "caregiver" | "child";
  color: string | null;
  status: "normal" | "under_the_weather" | "sick" | "rest_day";
};

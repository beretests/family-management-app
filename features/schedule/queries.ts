import { createClient } from "@/lib/supabase/server";
import type {
  ScheduleEvent,
  ScheduleEventType,
  ScheduleOccurrenceOverride,
} from "@/features/schedule/types";
import { expandRecurringEvent } from "@/features/schedule/recurrence";

type ScheduleEventRow = {
  id: string;
  family_id: string;
  member_id: string | null;
  task_instance_id: string | null;
  created_by_member_id: string | null;
  event_type: ScheduleEventType;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

type ScheduleEventMemberRow = {
  schedule_event_id: string;
  member_id: string;
};

type ScheduleEventRecurrenceRow = {
  event_id: string;
  frequency: "daily" | "weekly" | "yearly";
  interval_count: number;
  weekdays: number[];
  ends_on: string | null;
  occurrence_count: number | null;
  time_zone: string;
};

type ScheduleOccurrenceOverrideRow = {
  id: string;
  series_event_id: string;
  occurrence_date: string;
  status: "modified" | "cancelled";
  event_type: ScheduleEventType | null;
  title: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean | null;
  location: string | null;
  color: string | null;
  updated_at: string;
};

type ScheduleOccurrenceOverrideMemberRow = {
  override_id: string;
  member_id: string;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isMissingScheduleEventMembersTable(error: SupabaseErrorLike) {
  const message = error.message ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("schedule_event_members") &&
      (message.includes("Could not find") ||
        message.includes("does not exist") ||
        message.includes("schema cache")))
  );
}

function isMissingRecurrenceTable(error: SupabaseErrorLike) {
  const message = error.message ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("schedule_event_recurrences") &&
      (message.includes("Could not find") ||
        message.includes("does not exist") ||
        message.includes("schema cache")))
  );
}

function isMissingOccurrenceOverrideTable(error: SupabaseErrorLike) {
  const message = error.message ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("schedule_event_occurrence_override") &&
      (message.includes("Could not find") ||
        message.includes("does not exist") ||
        message.includes("schema cache")))
  );
}

function mapScheduleEvent(
  row: ScheduleEventRow,
  attendeeIds: string[],
  recurrence?: ScheduleEventRecurrenceRow,
): ScheduleEvent {
  const memberIds =
    attendeeIds.length > 0 ? attendeeIds : row.member_id ? [row.member_id] : [];

  return {
    id: row.id,
    familyId: row.family_id,
    memberId: memberIds[0] ?? null,
    memberIds,
    taskInstanceId: row.task_instance_id,
    createdByMemberId: row.created_by_member_id,
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    location: row.location,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recurrence: recurrence
      ? {
          frequency: recurrence.frequency,
          interval: recurrence.interval_count,
          weekdays: recurrence.weekdays,
          endsOn: recurrence.ends_on,
          occurrenceCount: recurrence.occurrence_count,
          timeZone: recurrence.time_zone,
        }
      : null,
  };
}

export async function getScheduleEvents({
  endsAt,
  familyId,
  startsAt,
}: {
  endsAt: Date;
  familyId: string;
  startsAt: Date;
}) {
  const supabase = await createClient();
  const { data: overlapData, error } = await supabase
    .from("schedule_events")
    .select(
      "id,family_id,member_id,task_instance_id,created_by_member_id,event_type,title,description,starts_at,ends_at,all_day,location,color,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: recurrenceData, error: recurrenceError } = await supabase
    .from("schedule_event_recurrences")
    .select(
      "event_id,frequency,interval_count,weekdays,ends_on,occurrence_count,time_zone",
    )
    .eq("family_id", familyId);

  if (recurrenceError && !isMissingRecurrenceTable(recurrenceError)) {
    throw new Error(recurrenceError.message);
  }

  const recurrenceRows = (recurrenceData ?? []) as ScheduleEventRecurrenceRow[];
  const recurrenceEventIds = recurrenceRows.map((row) => row.event_id);
  let recurringParentRows: ScheduleEventRow[] = [];

  if (recurrenceEventIds.length > 0) {
    const { data: parentData, error: parentError } = await supabase
      .from("schedule_events")
      .select(
        "id,family_id,member_id,task_instance_id,created_by_member_id,event_type,title,description,starts_at,ends_at,all_day,location,color,created_at,updated_at",
      )
      .eq("family_id", familyId)
      .in("id", recurrenceEventIds)
      .lt("starts_at", endsAt.toISOString());

    if (parentError) {
      throw new Error(parentError.message);
    }

    recurringParentRows = (parentData ?? []) as ScheduleEventRow[];
  }

  const rowsById = new Map<string, ScheduleEventRow>();

  for (const row of [
    ...((overlapData ?? []) as ScheduleEventRow[]),
    ...recurringParentRows,
  ]) {
    rowsById.set(row.id, row);
  }

  const eventRows = [...rowsById.values()];
  const eventIds = eventRows.map((event) => event.id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("schedule_event_members")
    .select("schedule_event_id,member_id")
    .eq("family_id", familyId)
    .in("schedule_event_id", eventIds);

  if (memberError) {
    if (isMissingScheduleEventMembersTable(memberError)) {
      return eventRows.flatMap((row) => {
        const recurrence = recurrenceRows.find(
          (item) => item.event_id === row.id,
        );
        return expandRecurringEvent(
          mapScheduleEvent(row, [], recurrence),
          startsAt,
          endsAt,
        );
      });
    }

    throw new Error(memberError.message);
  }

  const membersByEvent = new Map<string, string[]>();

  for (const row of (memberRows ?? []) as ScheduleEventMemberRow[]) {
    membersByEvent.set(row.schedule_event_id, [
      ...(membersByEvent.get(row.schedule_event_id) ?? []),
      row.member_id,
    ]);
  }

  const recurrenceByEvent = new Map(
    recurrenceRows.map((row) => [row.event_id, row]),
  );

  let overrideRows: ScheduleOccurrenceOverrideRow[] = [];

  if (recurrenceEventIds.length > 0) {
    const { data: overrideData, error: overrideError } = await supabase
      .from("schedule_event_occurrence_overrides")
      .select(
        "id,series_event_id,occurrence_date,status,event_type,title,description,starts_at,ends_at,all_day,location,color,updated_at",
      )
      .eq("family_id", familyId)
      .in("series_event_id", recurrenceEventIds);

    if (overrideError && !isMissingOccurrenceOverrideTable(overrideError)) {
      throw new Error(overrideError.message);
    }

    overrideRows = (overrideData ?? []) as ScheduleOccurrenceOverrideRow[];
  }
  const overrideIds = overrideRows.map((row) => row.id);
  let overrideMemberRows: ScheduleOccurrenceOverrideMemberRow[] = [];

  if (overrideIds.length > 0) {
    const { data, error: overrideMemberError } = await supabase
      .from("schedule_event_occurrence_override_members")
      .select("override_id,member_id")
      .eq("family_id", familyId)
      .in("override_id", overrideIds);

    if (
      overrideMemberError &&
      !isMissingOccurrenceOverrideTable(overrideMemberError)
    ) {
      throw new Error(overrideMemberError.message);
    }

    overrideMemberRows = (data ?? []) as ScheduleOccurrenceOverrideMemberRow[];
  }

  const membersByOverride = new Map<string, string[]>();

  for (const row of overrideMemberRows) {
    membersByOverride.set(row.override_id, [
      ...(membersByOverride.get(row.override_id) ?? []),
      row.member_id,
    ]);
  }

  const overridesByEvent = new Map<string, ScheduleOccurrenceOverride[]>();

  for (const row of overrideRows) {
    overridesByEvent.set(row.series_event_id, [
      ...(overridesByEvent.get(row.series_event_id) ?? []),
      {
        id: row.id,
        occurrenceDate: row.occurrence_date,
        status: row.status,
        memberIds: membersByOverride.get(row.id) ?? [],
        eventType: row.event_type,
        title: row.title,
        description: row.description,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        allDay: row.all_day,
        location: row.location,
        color: row.color,
        updatedAt: row.updated_at,
      },
    ]);
  }

  return eventRows
    .flatMap((row) =>
      expandRecurringEvent(
        mapScheduleEvent(
          row,
          membersByEvent.get(row.id) ?? [],
          recurrenceByEvent.get(row.id),
        ),
        startsAt,
        endsAt,
        overridesByEvent.get(row.id) ?? [],
      ),
    )
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );
}

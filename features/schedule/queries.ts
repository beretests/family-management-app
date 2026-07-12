import { createClient } from "@/lib/supabase/server";
import type { ScheduleEvent, ScheduleEventType } from "@/features/schedule/types";

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

function mapScheduleEvent(row: ScheduleEventRow): ScheduleEvent {
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
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
  const { data, error } = await supabase
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

  return ((data ?? []) as ScheduleEventRow[]).map(mapScheduleEvent);
}

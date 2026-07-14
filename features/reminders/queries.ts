import { createClient } from "@/lib/supabase/server";
import type {
  Reminder,
  ReminderStatus,
  ReminderType,
} from "@/features/reminders/types";

type ReminderRow = {
  id: string;
  family_id: string;
  member_id: string | null;
  task_instance_id: string | null;
  reward_redemption_id: string | null;
  reminder_type: ReminderType;
  message: string;
  remind_at: string;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
};

const reminderSelect =
  "id,family_id,member_id,task_instance_id,reward_redemption_id,reminder_type,message,remind_at,status,created_at,updated_at";

function mapReminder(row: ReminderRow): Reminder {
  return {
    createdAt: row.created_at,
    familyId: row.family_id,
    id: row.id,
    memberId: row.member_id,
    message: row.message,
    remindAt: row.remind_at,
    reminderType: row.reminder_type,
    rewardRedemptionId: row.reward_redemption_id,
    status: row.status,
    taskInstanceId: row.task_instance_id,
    updatedAt: row.updated_at,
  };
}

export async function getReminders({
  familyId,
  limit = 50,
  statuses = ["pending", "sent"],
}: {
  familyId: string;
  limit?: number;
  statuses?: ReminderStatus[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(reminderSelect)
    .eq("family_id", familyId)
    .in("status", statuses)
    .order("remind_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReminderRow[]).map(mapReminder);
}

export async function getUpcomingReminders({
  familyId,
  now,
  until,
}: {
  familyId: string;
  now: Date;
  until: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(reminderSelect)
    .eq("family_id", familyId)
    .in("status", ["pending", "sent"])
    .gte("remind_at", now.toISOString())
    .lte("remind_at", until.toISOString())
    .order("remind_at", { ascending: true })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReminderRow[]).map(mapReminder);
}

export async function getReminderCount(familyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .in("status", ["pending", "sent"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

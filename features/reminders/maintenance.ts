import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReminderInserts } from "@/features/reminders/generator";
import type {
  ExistingReminderTarget,
  ReminderGenerationRewardRedemption,
  ReminderGenerationTask,
  ReminderType,
} from "@/features/reminders/types";

type TaskRow = {
  id: string;
  family_id: string;
  assigned_to_member_id: string | null;
  title_snapshot: string;
  status: string;
  due_at: string | null;
  submitted_at: string | null;
  rejected_at: string | null;
};

type RewardRedemptionRow = {
  id: string;
  family_id: string;
  requested_by_member_id: string;
  status: string;
  requested_at: string;
  reward: { title: string } | { title: string }[] | null;
};

type ReminderRow = {
  member_id: string | null;
  reminder_type: ReminderType;
  reward_redemption_id: string | null;
  task_instance_id: string | null;
};

function rewardTitle(value: { title: string } | { title: string }[] | null) {
  if (Array.isArray(value)) {
    return value[0]?.title ?? "A reward";
  }

  return value?.title ?? "A reward";
}

function mapTask(row: TaskRow): ReminderGenerationTask {
  return {
    assignedToMemberId: row.assigned_to_member_id,
    dueAt: row.due_at,
    familyId: row.family_id,
    id: row.id,
    rejectedAt: row.rejected_at,
    status: row.status,
    submittedAt: row.submitted_at,
    titleSnapshot: row.title_snapshot,
  };
}

function mapRewardRedemption(
  row: RewardRedemptionRow,
): ReminderGenerationRewardRedemption {
  return {
    familyId: row.family_id,
    id: row.id,
    requestedAt: row.requested_at,
    requestedByMemberId: row.requested_by_member_id,
    rewardTitle: rewardTitle(row.reward),
    status: row.status,
  };
}

function mapReminder(row: ReminderRow): ExistingReminderTarget {
  return {
    memberId: row.member_id,
    reminderType: row.reminder_type,
    rewardRedemptionId: row.reward_redemption_id,
    taskInstanceId: row.task_instance_id,
  };
}

export async function generateDailyReminders({
  now = new Date(),
  supabase,
}: {
  now?: Date;
  supabase: SupabaseClient;
}) {
  const dueSoonEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const staleSubmittedStart = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  );
  const [
    { data: taskRows, error: taskError },
    { data: redemptionRows, error: redemptionError },
    { data: reminderRows, error: reminderError },
  ] = await Promise.all([
    supabase
      .from("task_instances")
      .select(
        "id,family_id,assigned_to_member_id,title_snapshot,status,due_at,submitted_at,rejected_at",
      )
      .in("status", ["assigned", "in_progress", "submitted", "rejected"])
      .or(
        `due_at.lte.${dueSoonEnd.toISOString()},submitted_at.gte.${staleSubmittedStart.toISOString()},rejected_at.gte.${staleSubmittedStart.toISOString()}`,
      )
      .limit(1000),
    supabase
      .from("reward_redemptions")
      .select(
        "id,family_id,requested_by_member_id,status,requested_at,reward:reward_catalog!reward_redemptions_reward_id_fkey(title)",
      )
      .eq("status", "requested")
      .limit(1000),
    supabase
      .from("reminders")
      .select("member_id,reminder_type,task_instance_id,reward_redemption_id")
      .neq("status", "cancelled")
      .limit(5000),
  ]);

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (redemptionError) {
    throw new Error(redemptionError.message);
  }

  if (reminderError) {
    throw new Error(reminderError.message);
  }

  const inserts = buildReminderInserts({
    existingReminders: ((reminderRows ?? []) as ReminderRow[]).map(mapReminder),
    now,
    rewardRedemptions: (
      (redemptionRows ?? []) as unknown as RewardRedemptionRow[]
    ).map(mapRewardRedemption),
    tasks: ((taskRows ?? []) as TaskRow[]).map(mapTask),
  });

  if (inserts.length === 0) {
    return { insertedReminders: 0 };
  }

  const { error: insertError } = await supabase
    .from("reminders")
    .insert(inserts);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { insertedReminders: inserts.length };
}

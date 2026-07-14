import type {
  ExistingReminderTarget,
  ReminderGenerationRewardRedemption,
  ReminderGenerationTask,
  ReminderInsert,
  ReminderType,
} from "@/features/reminders/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const activeTaskStatuses = new Set(["assigned", "in_progress", "rejected"]);

function reminderTargetKey({
  memberId,
  reminderType,
  rewardRedemptionId,
  taskInstanceId,
}: ExistingReminderTarget) {
  return [
    reminderType,
    memberId ?? "family",
    taskInstanceId ?? "none",
    rewardRedemptionId ?? "none",
  ].join(":");
}

function hasExistingReminder({
  existingKeys,
  memberId,
  reminderType,
  rewardRedemptionId = null,
  taskInstanceId = null,
}: {
  existingKeys: Set<string>;
  memberId: string | null;
  reminderType: ReminderType;
  rewardRedemptionId?: string | null;
  taskInstanceId?: string | null;
}) {
  return existingKeys.has(
    reminderTargetKey({
      memberId,
      reminderType,
      rewardRedemptionId,
      taskInstanceId,
    }),
  );
}

function createReminder({
  familyId,
  memberId,
  message,
  remindAt,
  reminderType,
  rewardRedemptionId = null,
  taskInstanceId = null,
}: {
  familyId: string;
  memberId: string | null;
  message: string;
  remindAt: Date;
  reminderType: ReminderType;
  rewardRedemptionId?: string | null;
  taskInstanceId?: string | null;
}): ReminderInsert {
  return {
    family_id: familyId,
    member_id: memberId,
    message,
    remind_at: remindAt.toISOString(),
    reminder_type: reminderType,
    reward_redemption_id: rewardRedemptionId,
    status: "pending",
    task_instance_id: taskInstanceId,
  };
}

export function buildReminderInserts({
  existingReminders,
  now,
  rewardRedemptions,
  tasks,
}: {
  existingReminders: ExistingReminderTarget[];
  now: Date;
  rewardRedemptions: ReminderGenerationRewardRedemption[];
  tasks: ReminderGenerationTask[];
}) {
  const existingKeys = new Set(existingReminders.map(reminderTargetKey));
  const reminders: ReminderInsert[] = [];
  const dueSoonEnd = new Date(now.getTime() + DAY_MS);

  for (const task of tasks) {
    if (!task.assignedToMemberId) {
      continue;
    }

    const dueAt = task.dueAt ? new Date(task.dueAt) : null;

    if (
      dueAt &&
      dueAt > now &&
      dueAt <= dueSoonEnd &&
      activeTaskStatuses.has(task.status) &&
      !hasExistingReminder({
        existingKeys,
        memberId: task.assignedToMemberId,
        reminderType: "chore_due_soon",
        taskInstanceId: task.id,
      })
    ) {
      reminders.push(
        createReminder({
          familyId: task.familyId,
          memberId: task.assignedToMemberId,
          message: `${task.titleSnapshot} is coming up soon.`,
          remindAt: dueAt,
          reminderType: "chore_due_soon",
          taskInstanceId: task.id,
        }),
      );
    }

    if (
      dueAt &&
      dueAt < now &&
      activeTaskStatuses.has(task.status) &&
      !hasExistingReminder({
        existingKeys,
        memberId: task.assignedToMemberId,
        reminderType: "chore_overdue",
        taskInstanceId: task.id,
      })
    ) {
      reminders.push(
        createReminder({
          familyId: task.familyId,
          memberId: task.assignedToMemberId,
          message: `${task.titleSnapshot} is ready for a catch-up.`,
          remindAt: now,
          reminderType: "chore_overdue",
          taskInstanceId: task.id,
        }),
      );
    }

    if (
      task.status === "rejected" &&
      !hasExistingReminder({
        existingKeys,
        memberId: task.assignedToMemberId,
        reminderType: "submission_rejected",
        taskInstanceId: task.id,
      })
    ) {
      reminders.push(
        createReminder({
          familyId: task.familyId,
          memberId: task.assignedToMemberId,
          message: `${task.titleSnapshot} has feedback and can be updated.`,
          remindAt: task.rejectedAt ? new Date(task.rejectedAt) : now,
          reminderType: "submission_rejected",
          taskInstanceId: task.id,
        }),
      );
    }
  }

  for (const task of tasks) {
    if (
      task.status === "submitted" &&
      !hasExistingReminder({
        existingKeys,
        memberId: null,
        reminderType: "submission_pending_review",
        taskInstanceId: task.id,
      })
    ) {
      reminders.push(
        createReminder({
          familyId: task.familyId,
          memberId: null,
          message: `${task.titleSnapshot} is waiting for parent review.`,
          remindAt: task.submittedAt ? new Date(task.submittedAt) : now,
          reminderType: "submission_pending_review",
          taskInstanceId: task.id,
        }),
      );
    }
  }

  for (const redemption of rewardRedemptions) {
    if (
      redemption.status === "requested" &&
      !hasExistingReminder({
        existingKeys,
        memberId: null,
        reminderType: "reward_redemption_pending",
        rewardRedemptionId: redemption.id,
      })
    ) {
      reminders.push(
        createReminder({
          familyId: redemption.familyId,
          memberId: null,
          message: `${redemption.rewardTitle} is waiting for reward review.`,
          remindAt: new Date(redemption.requestedAt),
          reminderType: "reward_redemption_pending",
          rewardRedemptionId: redemption.id,
        }),
      );
    }
  }

  return reminders;
}

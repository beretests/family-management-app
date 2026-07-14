export type ReminderStatus = "pending" | "sent" | "dismissed" | "cancelled";

export type ReminderType =
  | "chore_due_soon"
  | "chore_overdue"
  | "submission_pending_review"
  | "submission_rejected"
  | "reward_redemption_pending"
  | "schedule_conflict";

export type Reminder = {
  id: string;
  familyId: string;
  memberId: string | null;
  taskInstanceId: string | null;
  rewardRedemptionId: string | null;
  reminderType: ReminderType;
  message: string;
  remindAt: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReminderInsert = {
  family_id: string;
  member_id: string | null;
  task_instance_id: string | null;
  reward_redemption_id: string | null;
  reminder_type: ReminderType;
  message: string;
  remind_at: string;
  status: "pending";
};

export type ReminderGenerationTask = {
  id: string;
  familyId: string;
  assignedToMemberId: string | null;
  titleSnapshot: string;
  status: string;
  dueAt: string | null;
  submittedAt: string | null;
  rejectedAt: string | null;
};

export type ReminderGenerationRewardRedemption = {
  id: string;
  familyId: string;
  rewardTitle: string;
  requestedByMemberId: string;
  status: string;
  requestedAt: string;
};

export type ExistingReminderTarget = {
  memberId: string | null;
  taskInstanceId: string | null;
  rewardRedemptionId: string | null;
  reminderType: ReminderType;
};

import { describe, expect, it } from "vitest";
import { buildReminderInserts } from "@/features/reminders/generator";
import type {
  ExistingReminderTarget,
  ReminderGenerationRewardRedemption,
  ReminderGenerationTask,
} from "@/features/reminders/types";

const now = new Date("2026-07-14T12:00:00.000Z");

function task(
  overrides: Partial<ReminderGenerationTask>,
): ReminderGenerationTask {
  return {
    assignedToMemberId: "member-1",
    dueAt: "2026-07-14T18:00:00.000Z",
    familyId: "family-1",
    id: "task-1",
    rejectedAt: null,
    status: "assigned",
    submittedAt: null,
    titleSnapshot: "Sweep Kitchen",
    ...overrides,
  };
}

function redemption(
  overrides: Partial<ReminderGenerationRewardRedemption>,
): ReminderGenerationRewardRedemption {
  return {
    familyId: "family-1",
    id: "redemption-1",
    requestedAt: "2026-07-14T09:00:00.000Z",
    requestedByMemberId: "member-1",
    rewardTitle: "Movie picker",
    status: "requested",
    ...overrides,
  };
}

describe("buildReminderInserts", () => {
  it("creates due soon and overdue chore reminders", () => {
    const inserts = buildReminderInserts({
      existingReminders: [],
      now,
      rewardRedemptions: [],
      tasks: [
        task({ id: "due-soon", dueAt: "2026-07-14T18:00:00.000Z" }),
        task({ id: "overdue", dueAt: "2026-07-13T18:00:00.000Z" }),
      ],
    });

    expect(inserts.map((insert) => insert.reminder_type)).toEqual([
      "chore_due_soon",
      "chore_overdue",
    ]);
    expect(inserts.every((insert) => !insert.message.includes("late"))).toBe(
      true,
    );
  });

  it("creates parent-facing review reminders", () => {
    const inserts = buildReminderInserts({
      existingReminders: [],
      now,
      rewardRedemptions: [redemption({})],
      tasks: [
        task({
          assignedToMemberId: "member-1",
          dueAt: null,
          id: "submitted",
          status: "submitted",
          submittedAt: "2026-07-14T09:00:00.000Z",
        }),
      ],
    });

    expect(inserts).toMatchObject([
      {
        member_id: null,
        reminder_type: "submission_pending_review",
      },
      {
        member_id: null,
        reminder_type: "reward_redemption_pending",
      },
    ]);
  });

  it("does not duplicate existing active reminders", () => {
    const existingReminders: ExistingReminderTarget[] = [
      {
        memberId: "member-1",
        reminderType: "chore_due_soon",
        rewardRedemptionId: null,
        taskInstanceId: "task-1",
      },
    ];

    const inserts = buildReminderInserts({
      existingReminders,
      now,
      rewardRedemptions: [],
      tasks: [task({})],
    });

    expect(inserts).toEqual([]);
  });
});

import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { PointsLedgerEntry } from "@/features/points/types";

export type LeaderboardEntry = {
  memberId: string;
  displayName: string;
  color: string | null;
  ageYears: number | null;
  pointsBalance: number;
  taskPointsEarned: number;
  rewardPointsSpent: number;
  approvedTasks: number;
  progressScore: number;
  highlight: string;
};

export function buildLeaderboardEntries({
  entries,
  members,
}: {
  entries: PointsLedgerEntry[];
  members: FamilyMemberWithDetails[];
}) {
  return members
    .filter(
      (member) =>
        member.role === "child" && member.lifecycleStatus === "active",
    )
    .map<LeaderboardEntry>((member) => {
      const memberEntries = entries.filter(
        (entry) => entry.memberId === member.id,
      );
      const taskEntries = memberEntries.filter(
        (entry) => entry.source === "task_review" && entry.pointsDelta > 0,
      );
      const rewardEntries = memberEntries.filter(
        (entry) =>
          entry.source === "reward_redemption" && entry.pointsDelta < 0,
      );
      const approvedTasks = new Set(
        taskEntries
          .map((entry) => entry.taskInstanceId)
          .filter((taskId): taskId is string => Boolean(taskId)),
      ).size;
      const taskPointsEarned = taskEntries.reduce(
        (total, entry) => total + entry.pointsDelta,
        0,
      );
      const rewardPointsSpent = Math.abs(
        rewardEntries.reduce((total, entry) => total + entry.pointsDelta, 0),
      );
      const pointsBalance = memberEntries.reduce(
        (total, entry) => total + entry.pointsDelta,
        0,
      );
      const completionScore = Math.min(40, approvedTasks * 8);
      const effortScore = Math.min(30, Math.round(taskPointsEarned / 5));
      const savingsScore = Math.min(
        20,
        Math.round(Math.max(pointsBalance, 0) / 10),
      );
      const rewardUseScore = Math.min(10, Math.round(rewardPointsSpent / 20));
      const progressScore =
        completionScore + effortScore + savingsScore + rewardUseScore;

      return {
        ageYears: member.ageYears,
        approvedTasks,
        color: member.color,
        displayName: member.displayName,
        highlight: getHighlight({
          approvedTasks,
          pointsBalance,
          rewardPointsSpent,
          taskPointsEarned,
        }),
        memberId: member.id,
        pointsBalance,
        progressScore,
        rewardPointsSpent,
        taskPointsEarned,
      };
    })
    .sort((left, right) => {
      if (right.progressScore !== left.progressScore) {
        return right.progressScore - left.progressScore;
      }

      if (right.approvedTasks !== left.approvedTasks) {
        return right.approvedTasks - left.approvedTasks;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}

function getHighlight({
  approvedTasks,
  pointsBalance,
  rewardPointsSpent,
  taskPointsEarned,
}: {
  approvedTasks: number;
  pointsBalance: number;
  rewardPointsSpent: number;
  taskPointsEarned: number;
}) {
  if (approvedTasks === 0 && taskPointsEarned === 0) {
    return "Ready to start";
  }

  if (rewardPointsSpent > 0) {
    return "Enjoying earned rewards";
  }

  if (pointsBalance >= 100) {
    return "Saving steadily";
  }

  if (approvedTasks >= 5) {
    return "Showing consistency";
  }

  return "Making progress";
}

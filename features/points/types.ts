export type PointsLedgerSource =
  "task_review" | "manual_adjustment" | "reward_redemption" | "swap_adjustment";

export type PointsLedgerEntry = {
  id: string;
  familyId: string;
  memberId: string;
  taskInstanceId: string | null;
  rewardRedemptionId: string | null;
  source: PointsLedgerSource;
  pointsDelta: number;
  note: string | null;
  createdByMemberId: string | null;
  createdAt: string;
};

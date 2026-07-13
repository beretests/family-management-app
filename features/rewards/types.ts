export type RewardRedemptionStatus =
  "requested" | "approved" | "rejected" | "fulfilled" | "cancelled";

export type RewardCatalogItem = {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  pointsCost: number;
  minimumAge: number | null;
  maximumAge: number | null;
  active: boolean;
  requiresParentApproval: boolean;
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RewardRedemption = {
  id: string;
  familyId: string;
  rewardId: string;
  rewardTitle: string;
  requestedByMemberId: string;
  requestedByName: string;
  reviewedByMemberId: string | null;
  reviewedByName: string | null;
  status: RewardRedemptionStatus;
  pointsSpent: number;
  note: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RewardBalance = {
  memberId: string;
  pointsBalance: number;
  pointsEarned: number;
  pointsSpent: number;
};

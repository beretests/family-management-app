import { createClient } from "@/lib/supabase/server";
import type { PointsLedgerEntry } from "@/features/points/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type {
  RewardBalance,
  RewardCatalogItem,
  RewardRedemption,
  RewardRedemptionStatus,
} from "@/features/rewards/types";

type RewardCatalogRow = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  minimum_age: number | null;
  maximum_age: number | null;
  active: boolean;
  requires_parent_approval: boolean;
  created_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

type RewardRedemptionRow = {
  id: string;
  family_id: string;
  reward_id: string;
  reward: { title: string } | { title: string }[] | null;
  requested_by_member_id: string;
  requested_by: { display_name: string } | { display_name: string }[] | null;
  reviewed_by_member_id: string | null;
  reviewed_by: { display_name: string } | { display_name: string }[] | null;
  status: RewardRedemptionStatus;
  points_spent: number;
  note: string | null;
  requested_at: string;
  reviewed_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
};

type PointsLedgerRow = {
  id: string;
  family_id: string;
  member_id: string;
  task_instance_id: string | null;
  reward_redemption_id: string | null;
  source: PointsLedgerEntry["source"];
  points_delta: number;
  note: string | null;
  created_by_member_id: string | null;
  created_at: string;
};

const rewardCatalogSelect =
  "id,family_id,title,description,points_cost,minimum_age,maximum_age,active,requires_parent_approval,created_by_member_id,created_at,updated_at";

const rewardRedemptionSelect =
  "id,family_id,reward_id,reward:reward_catalog!reward_redemptions_reward_id_fkey(title),requested_by_member_id,requested_by:family_members!reward_redemptions_requested_by_member_id_fkey(display_name),reviewed_by_member_id,reviewed_by:family_members!reward_redemptions_reviewed_by_member_id_fkey(display_name),status,points_spent,note,requested_at,reviewed_at,fulfilled_at,created_at,updated_at";

const pointsLedgerSelect =
  "id,family_id,member_id,task_instance_id,reward_redemption_id,source,points_delta,note,created_by_member_id,created_at";

function firstName(
  value: { display_name: string } | { display_name: string }[] | null,
) {
  if (Array.isArray(value)) {
    return value[0]?.display_name ?? "Unknown";
  }

  return value?.display_name ?? "Unknown";
}

function firstRewardTitle(
  value: { title: string } | { title: string }[] | null,
) {
  if (Array.isArray(value)) {
    return value[0]?.title ?? "Reward";
  }

  return value?.title ?? "Reward";
}

function mapRewardCatalog(row: RewardCatalogRow): RewardCatalogItem {
  return {
    active: row.active,
    createdAt: row.created_at,
    createdByMemberId: row.created_by_member_id,
    description: row.description,
    familyId: row.family_id,
    id: row.id,
    maximumAge: row.maximum_age,
    minimumAge: row.minimum_age,
    pointsCost: row.points_cost,
    requiresParentApproval: row.requires_parent_approval,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapRewardRedemption(row: RewardRedemptionRow): RewardRedemption {
  return {
    createdAt: row.created_at,
    familyId: row.family_id,
    fulfilledAt: row.fulfilled_at,
    id: row.id,
    note: row.note,
    pointsSpent: row.points_spent,
    requestedAt: row.requested_at,
    requestedByMemberId: row.requested_by_member_id,
    requestedByName: firstName(row.requested_by),
    reviewedAt: row.reviewed_at,
    reviewedByMemberId: row.reviewed_by_member_id,
    reviewedByName: row.reviewed_by_member_id
      ? firstName(row.reviewed_by)
      : null,
    rewardId: row.reward_id,
    rewardTitle: firstRewardTitle(row.reward),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function mapPointsLedger(row: PointsLedgerRow): PointsLedgerEntry {
  return {
    createdAt: row.created_at,
    createdByMemberId: row.created_by_member_id,
    familyId: row.family_id,
    id: row.id,
    memberId: row.member_id,
    note: row.note,
    pointsDelta: row.points_delta,
    rewardRedemptionId: row.reward_redemption_id,
    source: row.source,
    taskInstanceId: row.task_instance_id,
  };
}

export function calculateRewardBalances({
  entries,
  members,
}: {
  entries: PointsLedgerEntry[];
  members: Pick<FamilyMemberWithDetails, "id">[];
}): RewardBalance[] {
  return members.map((member) => {
    const memberEntries = entries.filter(
      (entry) => entry.memberId === member.id,
    );
    const pointsEarned = memberEntries
      .filter((entry) => entry.pointsDelta > 0)
      .reduce((total, entry) => total + entry.pointsDelta, 0);
    const pointsSpent = Math.abs(
      memberEntries
        .filter((entry) => entry.pointsDelta < 0)
        .reduce((total, entry) => total + entry.pointsDelta, 0),
    );

    return {
      memberId: member.id,
      pointsBalance: pointsEarned - pointsSpent,
      pointsEarned,
      pointsSpent,
    };
  });
}

export async function getRewardCatalog(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reward_catalog")
    .select(rewardCatalogSelect)
    .eq("family_id", familyId)
    .order("active", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RewardCatalogRow[]).map(mapRewardCatalog);
}

export async function getRewardRedemptions(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select(rewardRedemptionSelect)
    .eq("family_id", familyId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RewardRedemptionRow[]).map(
    mapRewardRedemption,
  );
}

export async function getPointsLedgerEntries(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("points_ledger")
    .select(pointsLedgerSelect)
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PointsLedgerRow[]).map(mapPointsLedger);
}

export async function getRewardPageData({
  familyId,
  members,
}: {
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const [catalog, redemptions, ledgerEntries] = await Promise.all([
    getRewardCatalog(familyId),
    getRewardRedemptions(familyId),
    getPointsLedgerEntries(familyId),
  ]);

  return {
    balances: calculateRewardBalances({ entries: ledgerEntries, members }),
    catalog,
    redemptions,
  };
}

export async function getActiveRewardCount(familyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reward_catalog")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getPendingRewardRedemptionCount(familyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reward_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("status", "requested");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

import type { FamilyMemberWithDetails } from "@/features/family/types";
import { buildLeaderboardEntries } from "@/features/leaderboard/scoring";
import { getPointsLedgerEntries } from "@/features/rewards/queries";

export async function getFamilyLeaderboard({
  familyId,
  members,
}: {
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const entries = await getPointsLedgerEntries(familyId);

  return buildLeaderboardEntries({ entries, members });
}

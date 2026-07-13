import { describe, expect, it } from "vitest";
import { buildLeaderboardEntries } from "@/features/leaderboard/scoring";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { PointsLedgerEntry } from "@/features/points/types";

const baseMember = {
  abilityLevel: 3,
  birthdate: null,
  currentStatus: null,
  deactivatedAt: null,
  familyId: "family-1",
  lifecycleStatus: "active",
  preferences: null,
  profileId: null,
  role: "child",
} satisfies Partial<FamilyMemberWithDetails>;

function member(id: string, displayName: string): FamilyMemberWithDetails {
  return {
    ...baseMember,
    ageYears: 10,
    color: "#047857",
    displayName,
    id,
  } as FamilyMemberWithDetails;
}

function entry(
  memberId: string,
  pointsDelta: number,
  source: PointsLedgerEntry["source"],
  taskInstanceId: string | null = null,
): PointsLedgerEntry {
  return {
    createdAt: "2026-07-13T00:00:00.000Z",
    createdByMemberId: "parent-1",
    familyId: "family-1",
    id: `${memberId}-${source}-${pointsDelta}-${taskInstanceId ?? "none"}`,
    memberId,
    note: null,
    pointsDelta,
    rewardRedemptionId: source === "reward_redemption" ? "reward-1" : null,
    source,
    taskInstanceId,
  };
}

describe("buildLeaderboardEntries", () => {
  it("uses a progress score instead of raw point balance only", () => {
    const entries = buildLeaderboardEntries({
      entries: [
        entry("ari", 20, "task_review", "task-1"),
        entry("ari", 20, "task_review", "task-2"),
        entry("ari", -40, "reward_redemption"),
        entry("bea", 50, "task_review", "task-3"),
      ],
      members: [member("ari", "Ari"), member("bea", "Bea")],
    });

    expect(entries[0]?.memberId).toBe("ari");
    expect(entries[0]?.pointsBalance).toBe(0);
    expect(entries[1]?.pointsBalance).toBe(50);
  });

  it("does not include inactive children or adults", () => {
    const inactive = {
      ...member("inactive", "Inactive"),
      lifecycleStatus: "inactive",
    } as FamilyMemberWithDetails;
    const parent = {
      ...member("parent", "Parent"),
      role: "parent",
    } as FamilyMemberWithDetails;

    const entries = buildLeaderboardEntries({
      entries: [],
      members: [member("ari", "Ari"), inactive, parent],
    });

    expect(entries.map((item) => item.memberId)).toEqual(["ari"]);
  });
});

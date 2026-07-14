import { describe, expect, it } from "vitest";
import { selectCleanupCandidates } from "@/lib/storage/evidence-cleanup";
import type { EvidenceCleanupCandidate } from "@/lib/storage/evidence-cleanup";

const now = new Date("2026-07-14T12:00:00.000Z");

function candidate(
  overrides: Partial<EvidenceCleanupCandidate>,
): EvidenceCleanupCandidate {
  return {
    createdAt: "2026-06-01T12:00:00.000Z",
    id: "evidence-1",
    retentionDeleteAfter: null,
    storageBucket: "task-evidence",
    storagePath: "family/task/member/evidence.jpg",
    taskApprovedAt: "2026-06-01T12:00:00.000Z",
    taskRejectedAt: null,
    taskStatus: "approved",
    ...overrides,
  };
}

describe("selectCleanupCandidates", () => {
  it("selects reviewed evidence older than the retention window", () => {
    expect(
      selectCleanupCandidates({
        candidates: [candidate({})],
        now,
        retentionDays: 30,
      }).map((item) => item.id),
    ).toEqual(["evidence-1"]);
  });

  it("keeps recent reviewed evidence", () => {
    expect(
      selectCleanupCandidates({
        candidates: [
          candidate({
            id: "recent",
            taskApprovedAt: "2026-07-01T12:00:00.000Z",
          }),
        ],
        now,
        retentionDays: 30,
      }),
    ).toEqual([]);
  });

  it("does not clean evidence for unreviewed tasks", () => {
    expect(
      selectCleanupCandidates({
        candidates: [
          candidate({
            id: "submitted",
            taskApprovedAt: null,
            taskStatus: "submitted",
          }),
        ],
        now,
        retentionDays: 30,
      }),
    ).toEqual([]);
  });

  it("honors explicit retention timestamps", () => {
    expect(
      selectCleanupCandidates({
        candidates: [
          candidate({
            id: "explicit",
            retentionDeleteAfter: "2026-07-13T12:00:00.000Z",
            taskApprovedAt: null,
            taskStatus: "submitted",
          }),
        ],
        now,
        retentionDays: 30,
      }).map((item) => item.id),
    ).toEqual(["explicit"]);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildEvidenceStoragePath,
  isAllowedEvidenceContentType,
  MAX_EVIDENCE_FILE_BYTES,
  validateEvidenceFile,
} from "@/lib/storage/evidence";

describe("evidence storage helpers", () => {
  it("builds storage paths scoped by family, task, and member", () => {
    expect(
      buildEvidenceStoragePath({
        evidenceId: "55555555-5555-4555-8555-555555555555",
        familyId: "11111111-1111-4111-8111-111111111111",
        memberId: "33333333-3333-4333-8333-333333333333",
        taskId: "22222222-2222-4222-8222-222222222222",
        type: "image/png",
      }),
    ).toBe(
      "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/55555555-5555-4555-8555-555555555555.png",
    );
  });

  it("allows only supported image content types", () => {
    expect(isAllowedEvidenceContentType("image/jpeg")).toBe(true);
    expect(isAllowedEvidenceContentType("application/pdf")).toBe(false);
  });

  it("rejects oversized files", () => {
    const file = new File(["x".repeat(10)], "evidence.png", {
      type: "image/png",
    });
    Object.defineProperty(file, "size", {
      value: MAX_EVIDENCE_FILE_BYTES + 1,
    });

    expect(validateEvidenceFile(file)).toBe(
      "Evidence photos must be 5 MB or smaller.",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  approveTaskSchema,
  rejectTaskSchema,
} from "@/features/reviews/schemas";

const validBase = {
  familyId: "11111111-1111-4111-8111-111111111111",
  pointsAwarded: "15",
  submissionId: "22222222-2222-4222-8222-222222222222",
  taskId: "33333333-3333-4333-8333-333333333333",
};

describe("approveTaskSchema", () => {
  it("accepts whole-number awarded points", () => {
    const parsed = approveTaskSchema.safeParse(validBase);

    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.pointsAwarded : null).toBe(15);
  });

  it("rejects negative awarded points", () => {
    expect(
      approveTaskSchema.safeParse({
        ...validBase,
        pointsAwarded: "-1",
      }).success,
    ).toBe(false);
  });
});

describe("rejectTaskSchema", () => {
  it("requires kind feedback", () => {
    expect(
      rejectTaskSchema.safeParse({
        ...validBase,
        feedback: "Please wipe the mirror once more.",
        pointsAwarded: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects empty feedback", () => {
    expect(
      rejectTaskSchema.safeParse({
        ...validBase,
        feedback: "",
        pointsAwarded: 0,
      }).success,
    ).toBe(false);
  });
});

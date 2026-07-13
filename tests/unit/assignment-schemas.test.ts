import { describe, expect, it } from "vitest";
import { createAssignmentsSchema } from "@/features/assignments/schemas";

describe("createAssignmentsSchema", () => {
  it("accepts assignment selections", () => {
    expect(
      createAssignmentsSchema.safeParse({
        assignmentDate: "2026-07-13",
        dueTime: "18:00",
        familyId: "11111111-1111-4111-8111-111111111111",
        selections: [
          {
            memberId: "22222222-2222-4222-8222-222222222222",
            templateId: "33333333-3333-4333-8333-333333333333",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires at least one selected assignment", () => {
    const parsed = createAssignmentsSchema.safeParse({
      assignmentDate: "2026-07-13",
      dueTime: "18:00",
      familyId: "11111111-1111-4111-8111-111111111111",
      selections: [],
    });

    expect(parsed.success).toBe(false);
  });
});

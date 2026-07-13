import { describe, expect, it } from "vitest";
import {
  submitTaskSchema,
  updateSubtaskSchema,
} from "@/features/tasks/schemas";

describe("updateSubtaskSchema", () => {
  it("accepts checklist updates", () => {
    expect(
      updateSubtaskSchema.safeParse({
        completed: "true",
        subtaskId: "11111111-1111-4111-8111-111111111111",
        taskId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid completion values", () => {
    expect(
      updateSubtaskSchema.safeParse({
        completed: "yes",
        subtaskId: "11111111-1111-4111-8111-111111111111",
        taskId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
  });
});

describe("submitTaskSchema", () => {
  it("accepts short notes", () => {
    expect(
      submitTaskSchema.safeParse({
        note: "Done and ready for review.",
        taskId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });

  it("rejects long notes", () => {
    expect(
      submitTaskSchema.safeParse({
        note: "x".repeat(501),
        taskId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
  });
});

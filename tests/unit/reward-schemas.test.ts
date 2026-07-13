import { describe, expect, it } from "vitest";
import {
  createRewardSchema,
  requestRewardRedemptionSchema,
  updateRewardSchema,
} from "@/features/rewards/schemas";

describe("createRewardSchema", () => {
  it("accepts a non-monetary reward", () => {
    const parsed = createRewardSchema.safeParse({
      active: true,
      description: "Choose the family movie.",
      familyId: "11111111-1111-4111-8111-111111111111",
      maximumAge: "",
      minimumAge: "8",
      pointsCost: "40",
      title: "Movie picker",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an inverted age range", () => {
    const parsed = createRewardSchema.safeParse({
      active: true,
      description: "",
      familyId: "11111111-1111-4111-8111-111111111111",
      maximumAge: "7",
      minimumAge: "10",
      pointsCost: "40",
      title: "Park trip",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("updateRewardSchema", () => {
  it("requires a reward id", () => {
    const parsed = updateRewardSchema.safeParse({
      active: true,
      description: "",
      familyId: "11111111-1111-4111-8111-111111111111",
      maximumAge: "",
      minimumAge: "",
      pointsCost: "25",
      rewardId: "",
      title: "Extra reading time",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("requestRewardRedemptionSchema", () => {
  it("limits kid notes", () => {
    const parsed = requestRewardRedemptionSchema.safeParse({
      familyId: "11111111-1111-4111-8111-111111111111",
      note: "x".repeat(301),
      rewardId: "22222222-2222-4222-8222-222222222222",
    });

    expect(parsed.success).toBe(false);
  });
});

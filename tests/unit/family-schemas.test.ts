import { describe, expect, it } from "vitest";
import {
  childMemberSchema,
  familySetupSchema,
  memberStatusSchema,
} from "@/features/family/schemas";

const familyId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";

describe("familySetupSchema", () => {
  it("trims family and parent names", () => {
    const parsed = familySetupSchema.parse({
      familyName: "  Rivera Family  ",
      parentDisplayName: "  Alex  ",
    });

    expect(parsed.familyName).toBe("Rivera Family");
    expect(parsed.parentDisplayName).toBe("Alex");
  });

  it("requires both setup names", () => {
    const parsed = familySetupSchema.safeParse({
      familyName: "",
      parentDisplayName: "",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("childMemberSchema", () => {
  it("coerces numeric fields and normalizes empty notes", () => {
    const parsed = childMemberSchema.parse({
      familyId,
      displayName: " Ari ",
      ageYears: "8",
      abilityLevel: "3",
      color: "#047857",
      notes: "",
    });

    expect(parsed.displayName).toBe("Ari");
    expect(parsed.ageYears).toBe(8);
    expect(parsed.abilityLevel).toBe(3);
    expect(parsed.notes).toBeUndefined();
  });

  it("rejects out-of-range ages and invalid colors", () => {
    const parsed = childMemberSchema.safeParse({
      familyId,
      displayName: "Ari",
      ageYears: "22",
      abilityLevel: "3",
      color: "green",
      notes: "ok",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("memberStatusSchema", () => {
  it("accepts supported rest and sick status values", () => {
    const parsed = memberStatusSchema.parse({
      familyId,
      memberId,
      status: "under_the_weather",
      note: "Low energy today",
    });

    expect(parsed.status).toBe("under_the_weather");
    expect(parsed.note).toBe("Low energy today");
  });
});

import { describe, expect, it } from "vitest";
import {
  adultInviteSchema,
  acceptChildEmailInvitationSchema,
  childEmailInviteSchema,
  childPinSchema,
  childMemberSchema,
  familySetupSchema,
  memberStatusSchema,
  newChildAccountPasswordSchema,
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
      birthMonth: "2018-07",
      abilityLevel: "3",
      color: "#047857",
      notes: "",
    });

    expect(parsed.displayName).toBe("Ari");
    expect(parsed.birthMonth).toBe("2018-07");
    expect(parsed.abilityLevel).toBe(3);
    expect(parsed.notes).toBeUndefined();
  });

  it("rejects adult birth months and invalid colors", () => {
    const parsed = childMemberSchema.safeParse({
      familyId,
      displayName: "Ari",
      birthMonth: "1999-07",
      abilityLevel: "3",
      color: "green",
      notes: "ok",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("adultInviteSchema", () => {
  it("normalizes adult invite emails", () => {
    const parsed = adultInviteSchema.parse({
      familyId,
      displayName: " Sam ",
      email: " CARE@Example.COM ",
      role: "caregiver",
    });

    expect(parsed.displayName).toBe("Sam");
    expect(parsed.email).toBe("care@example.com");
  });

  it("allows only parent or caregiver adult invite roles", () => {
    const parsed = adultInviteSchema.safeParse({
      familyId,
      displayName: "Sam",
      email: "care@example.com",
      role: "child",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("childEmailInviteSchema", () => {
  it("normalizes email and requires parent consent", () => {
    const parsed = childEmailInviteSchema.parse({
      familyId,
      memberId,
      email: " KID@Example.COM ",
      consent: "on",
    });

    expect(parsed.email).toBe("kid@example.com");
    expect(parsed.deliveryMethod).toBe("email");
    expect(
      childEmailInviteSchema.parse({
        familyId,
        memberId,
        email: "kid@example.com",
        consent: "on",
        deliveryMethod: "copy_link",
      }).deliveryMethod,
    ).toBe("copy_link");
    expect(
      childEmailInviteSchema.safeParse({
        familyId,
        memberId,
        email: "kid@example.com",
        consent: "",
      }).success,
    ).toBe(false);
    expect(
      childEmailInviteSchema.safeParse({
        familyId,
        memberId,
        email: "kid@example.com",
        consent: "on",
        deliveryMethod: "public_link",
      }).success,
    ).toBe(false);
  });
});

describe("acceptChildEmailInvitationSchema", () => {
  it("allows passwordless existing-account acceptance but rejects mismatches", () => {
    expect(
      acceptChildEmailInvitationSchema.safeParse({
        invitationId: "66666666-6666-4666-8666-666666666666",
        password: "",
        confirmPassword: "",
      }).success,
    ).toBe(true);
    expect(
      acceptChildEmailInvitationSchema.safeParse({
        invitationId: "66666666-6666-4666-8666-666666666666",
        password: "family-pass",
        confirmPassword: "family-pass",
      }).success,
    ).toBe(true);
    expect(
      acceptChildEmailInvitationSchema.safeParse({
        invitationId: "66666666-6666-4666-8666-666666666666",
        password: "family-pass",
        confirmPassword: "different-pass",
      }).success,
    ).toBe(false);
  });

  it("requires a strong matching password for new child accounts", () => {
    expect(
      newChildAccountPasswordSchema.safeParse({
        password: "family-pass",
        confirmPassword: "family-pass",
      }).success,
    ).toBe(true);
    expect(
      newChildAccountPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
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

describe("childPinSchema", () => {
  it("accepts matching 4 to 8 digit PINs", () => {
    const parsed = childPinSchema.parse({
      confirmPin: "1234",
      familyId,
      memberId,
      pin: "1234",
    });

    expect(parsed.pin).toBe("1234");
  });

  it("rejects mismatched or non-numeric PINs", () => {
    expect(
      childPinSchema.safeParse({
        confirmPin: "1235",
        familyId,
        memberId,
        pin: "1234",
      }).success,
    ).toBe(false);
    expect(
      childPinSchema.safeParse({
        confirmPin: "abcd",
        familyId,
        memberId,
        pin: "abcd",
      }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  emailPasswordSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema,
} from "@/features/auth/schemas";

describe("emailPasswordSchema", () => {
  it("normalizes email and next path", () => {
    const parsed = emailPasswordSchema.parse({
      email: " Parent@Example.COM ",
      password: "password123",
      next: "/dashboard",
    });

    expect(parsed.email).toBe("parent@example.com");
    expect(parsed.next).toBe("/dashboard");
  });

  it("rejects short passwords and unsafe redirects", () => {
    const parsed = emailPasswordSchema.safeParse({
      email: "parent@example.com",
      password: "short",
      next: "https://example.com",
    });

    expect(parsed.success).toBe(false);

    const safeRedirect = emailPasswordSchema.parse({
      email: "parent@example.com",
      password: "password123",
      next: "https://example.com",
    });

    expect(safeRedirect.next).toBe("/dashboard");
  });
});

describe("passwordResetRequestSchema", () => {
  it("normalizes and validates the email address", () => {
    expect(
      passwordResetRequestSchema.parse({ email: " Parent@Example.COM " }),
    ).toEqual({ email: "parent@example.com" });

    expect(
      passwordResetRequestSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("passwordUpdateSchema", () => {
  it("accepts matching passwords with at least eight characters", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "new-password",
        confirmPassword: "new-password",
      }).success,
    ).toBe(true);
  });

  it("rejects short or mismatched passwords", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);

    const mismatched = passwordUpdateSchema.safeParse({
      password: "new-password",
      confirmPassword: "other-password",
    });

    expect(mismatched.success).toBe(false);
    if (!mismatched.success) {
      expect(mismatched.error.issues[0]?.message).toBe(
        "Passwords do not match.",
      );
    }
  });
});

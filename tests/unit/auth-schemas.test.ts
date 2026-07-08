import { describe, expect, it } from "vitest";
import { emailPasswordSchema } from "@/features/auth/schemas";

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

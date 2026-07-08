import { describe, expect, it } from "vitest";
import {
  buildAuthRedirect,
  normalizeRedirectPath,
} from "@/lib/auth/redirects";

describe("normalizeRedirectPath", () => {
  it("allows local absolute paths", () => {
    expect(normalizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(normalizeRedirectPath("/dashboard?tab=today")).toBe(
      "/dashboard?tab=today",
    );
  });

  it("blocks external and protocol-relative redirects", () => {
    expect(normalizeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(normalizeRedirectPath("//example.com")).toBe("/dashboard");
    expect(normalizeRedirectPath(null)).toBe("/dashboard");
  });
});

describe("buildAuthRedirect", () => {
  it("adds only defined params", () => {
    expect(
      buildAuthRedirect("/sign-in", {
        error: "Try again",
        message: undefined,
        next: "/dashboard",
      }),
    ).toBe("/sign-in?error=Try+again&next=%2Fdashboard");
  });
});

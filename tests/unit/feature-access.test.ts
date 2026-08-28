import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { routeRequiresFullApp } from "@/lib/feature-access";
import { parseFeatureFlag } from "@/lib/feature-flags";
import { proxy } from "@/proxy";

const originalFullAppFlag = process.env.ENABLE_FULL_APP;

afterEach(() => {
  if (originalFullAppFlag === undefined) {
    delete process.env.ENABLE_FULL_APP;
  } else {
    process.env.ENABLE_FULL_APP = originalFullAppFlag;
  }
});

describe("parseFeatureFlag", () => {
  it("enables a feature only for an explicit true value", () => {
    expect(parseFeatureFlag("true")).toBe(true);
    expect(parseFeatureFlag(" TRUE ")).toBe(true);
    expect(parseFeatureFlag("false")).toBe(false);
    expect(parseFeatureFlag(undefined)).toBe(false);
  });
});

describe("routeRequiresFullApp", () => {
  it.each([
    "/dashboard",
    "/my-today",
    "/chores/template",
    "/assignments",
    "/approvals",
    "/rewards",
    "/leaderboard",
    "/reminders",
    "/kid-mode",
  ])("gates the full-app route %s", (pathname) => {
    expect(routeRequiresFullApp(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/schedule",
    "/groceries",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/callback",
    "/family/setup",
    "/family/invite/accept",
    "/family/child-invite/accept",
    "/settings/family",
    "/api/cron/daily-maintenance",
  ])("keeps the calendar support route %s available", (pathname) => {
    expect(routeRequiresFullApp(pathname)).toBe(false);
  });
});

describe("calendar-only proxy", () => {
  it("redirects a gated feature route to Calendar by default", async () => {
    delete process.env.ENABLE_FULL_APP;

    const response = await proxy(
      new NextRequest("https://family.example/chores?tab=weekly"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://family.example/schedule",
    );
  });
});

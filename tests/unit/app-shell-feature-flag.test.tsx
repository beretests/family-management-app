import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "@/components/layout/app-shell";

const originalFullAppFlag = process.env.ENABLE_FULL_APP;

afterEach(() => {
  cleanup();

  if (originalFullAppFlag === undefined) {
    delete process.env.ENABLE_FULL_APP;
  } else {
    process.env.ENABLE_FULL_APP = originalFullAppFlag;
  }
});

describe("AppShell feature flag", () => {
  it("shows only Calendar navigation by default", () => {
    delete process.env.ENABLE_FULL_APP;

    render(<AppShell>Calendar content</AppShell>);

    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/schedule",
    );
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Chores" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Rewards" })).toBeNull();
  });

  it("restores the existing navigation when the full app is enabled", () => {
    process.env.ENABLE_FULL_APP = "true";

    render(<AppShell>Full app content</AppShell>);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Schedule" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Chores" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Assignments" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Approvals" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Rewards" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Leaderboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Reminders" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Family" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Kid Mode" })).toBeVisible();
  });
});

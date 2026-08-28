import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "@/components/layout/app-shell";
import type { FamilyMember } from "@/features/family/types";

const parentMember: FamilyMember = {
  id: "11111111-1111-4111-8111-111111111111",
  familyId: "22222222-2222-4222-8222-222222222222",
  profileId: "33333333-3333-4333-8333-333333333333",
  displayName: "Parent",
  role: "parent",
  birthdate: null,
  ageYears: null,
  abilityLevel: 5,
  color: "#047857",
  lifecycleStatus: "active",
  deactivatedAt: null,
};

const childMember: FamilyMember = {
  ...parentMember,
  id: "44444444-4444-4444-8444-444444444444",
  profileId: "55555555-5555-4555-8555-555555555555",
  displayName: "Child",
  role: "child",
};

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
  it("collapses the mobile menu and restores focus when Escape closes it", () => {
    delete process.env.ENABLE_FULL_APP;

    render(<AppShell currentMember={parentMember}>Calendar content</AppShell>);

    const menuButton = screen.getByRole("button", { name: "Menu" });
    const menu = document.getElementById("primary-navigation-menu");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveClass("hidden", "sm:contents");

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(menu).toHaveClass("grid");
    expect(menu).not.toHaveClass("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(menuButton).toHaveFocus();
  });

  it("closes the mobile menu when a route is selected", () => {
    delete process.env.ENABLE_FULL_APP;

    render(<AppShell currentMember={parentMember}>Calendar content</AppShell>);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const calendarLink = screen.getByRole("link", { name: "Calendar" });
    calendarLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(calendarLink);

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("shows Calendar and Groceries navigation by default", () => {
    delete process.env.ENABLE_FULL_APP;

    render(<AppShell>Calendar content</AppShell>);

    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/schedule",
    );
    expect(screen.getByRole("link", { name: "Groceries" })).toHaveAttribute(
      "href",
      "/groceries",
    );
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Chores" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Rewards" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Family" })).toBeNull();
  });

  it("adds Family to the limited rollout for parents only", () => {
    delete process.env.ENABLE_FULL_APP;

    const { rerender } = render(
      <AppShell currentMember={parentMember}>Parent content</AppShell>,
    );

    expect(screen.getByRole("link", { name: "Family" })).toHaveAttribute(
      "href",
      "/settings/family",
    );

    rerender(<AppShell currentMember={childMember}>Child content</AppShell>);
    expect(screen.queryByRole("link", { name: "Family" })).toBeNull();
    expect(screen.getByText("Child account: Child")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Exit Kid Mode" })).toBeNull();
  });

  it("shows exit controls only for a verified Kid Mode session", () => {
    delete process.env.ENABLE_FULL_APP;

    render(
      <AppShell currentMember={childMember} isKidMode>
        Kid Mode content
      </AppShell>,
    );

    expect(screen.getByText("Kid Mode: Child")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: "Exit Kid Mode" })).toBeVisible();
    expect(screen.queryByText("Child account: Child")).toBeNull();
  });

  it("restores the existing navigation when the full app is enabled", () => {
    process.env.ENABLE_FULL_APP = "true";

    render(<AppShell currentMember={parentMember}>Full app content</AppShell>);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Schedule" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Chores" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Assignments" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Approvals" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Rewards" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Groceries" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Leaderboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Reminders" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Family" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Kid Mode" })).toBeVisible();
  });
});

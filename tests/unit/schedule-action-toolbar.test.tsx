import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleActionToolbar } from "@/components/schedule/schedule-action-toolbar";
import type { FamilyMemberWithDetails } from "@/features/family/types";

const member: FamilyMemberWithDetails = {
  id: "33333333-3333-4333-8333-333333333333",
  familyId: "22222222-2222-4222-8222-222222222222",
  profileId: null,
  displayName: "Ari",
  role: "child",
  birthdate: "2018-07-01",
  ageYears: 8,
  abilityLevel: 3,
  color: "#2563eb",
  lifecycleStatus: "active",
  deactivatedAt: null,
  preferences: null,
  currentStatus: null,
  hasKidModePin: false,
};

describe("ScheduleActionToolbar", () => {
  it("opens compact calendar actions in modals", () => {
    render(
      <ScheduleActionToolbar
        actorMemberId={member.id}
        canManageAll
        defaultEndsAt="2026-09-01T23:00:00.000Z"
        defaultStartsAt="2026-09-01T22:00:00.000Z"
        familyId={member.familyId}
        members={[member]}
        timeZone="America/Regina"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const addButton = screen.getByRole("button", { name: "Add event" });
    addButton.focus();
    fireEvent.click(addButton);

    const addDialog = screen.getByRole("dialog", {
      name: "Add schedule item",
    });
    fireEvent.change(within(addDialog).getByLabelText("Type"), {
      target: { value: "no_school" },
    });

    expect(within(addDialog).getByLabelText("All day")).toBeChecked();
    expect(within(addDialog).getByLabelText("All day")).toBeDisabled();
    expect(within(addDialog).getByLabelText("First day")).toBeVisible();
    expect(within(addDialog).getByLabelText("Last day")).toBeVisible();
    expect(
      within(addDialog).getByText(
        "No School entries are always saved as all-day events.",
      ),
    ).toBeVisible();

    fireEvent.click(
      within(addDialog).getByRole("button", { name: "Close add event" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(addButton).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Import calendar" }));
    expect(
      screen.getByRole("dialog", { name: "Import calendar file" }),
    ).toBeVisible();
  });
});

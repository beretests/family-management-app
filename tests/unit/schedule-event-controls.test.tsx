import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";

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

describe("schedule event controls", () => {
  it("shows details only in a modal opened from an event", () => {
    const event = recurringOccurrence();
    render(
      <ScheduleTimeGrid
        actorMemberId={member.id}
        canManageAll
        conflicts={new Map()}
        days={[new Date(2026, 7, 20)]}
        events={[event]}
        familyId={member.familyId}
        members={[member]}
        timeZone="America/Regina"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Event details")).not.toBeInTheDocument();

    const eventButton = screen.getByRole("button", { name: /Practice/ });
    eventButton.focus();
    fireEvent.click(eventButton);

    const dialog = screen.getByRole("dialog", { name: "Practice" });
    expect(dialog).toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(dialog).getByText("Edit event"));

    const editScope = screen.getByLabelText("Apply changes to");
    const deleteScope = screen.getByLabelText("Delete");

    expect(
      within(editScope).getByRole("option", { name: "This event" }),
    ).toBeInTheDocument();
    expect(
      within(editScope).getByRole("option", {
        name: "This and following events",
      }),
    ).toBeInTheDocument();
    expect(
      within(editScope).getByRole("option", { name: "Entire series" }),
    ).toBeInTheDocument();
    expect(within(deleteScope).getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Delete event" })).toBeVisible();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close event details" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(eventButton).toHaveFocus();
  });
});

function recurringOccurrence(): ScheduleEvent {
  return {
    id: "44444444-4444-4444-8444-444444444444:2026-08-20T22:00:00.000Z",
    sourceEventId: "44444444-4444-4444-8444-444444444444",
    occurrenceDate: "2026-08-20",
    seriesStartsAt: "2026-08-13T22:00:00.000Z",
    seriesEndsAt: "2026-08-13T23:00:00.000Z",
    familyId: member.familyId,
    memberId: member.id,
    memberIds: [member.id],
    taskInstanceId: null,
    createdByMemberId: member.id,
    eventType: "extracurricular",
    title: "Practice",
    description: null,
    startsAt: "2026-08-20T22:00:00.000Z",
    endsAt: "2026-08-20T23:00:00.000Z",
    allDay: false,
    location: null,
    color: null,
    createdAt: "2026-08-13T22:00:00.000Z",
    updatedAt: "2026-08-13T22:00:00.000Z",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      weekdays: [],
      endsOn: null,
      occurrenceCount: 8,
      timeZone: "America/Regina",
    },
  };
}

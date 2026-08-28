import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";

const day = new Date(2026, 6, 12);
const member: FamilyMemberWithDetails = {
  id: "member-a",
  familyId: "family-a",
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

describe("ScheduleTimeGrid", () => {
  it("renders a timed day event in the shared calendar grid", () => {
    render(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={[day]}
        events={[
          eventAt("dance", new Date(2026, 6, 12, 8), new Date(2026, 6, 12, 9)),
        ]}
        members={[member]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Daily calendar" }),
    ).toBeInTheDocument();
    const desktopGrid = screen.getByTestId("schedule-time-grid");
    expect(
      within(desktopGrid).getByLabelText(/Dance practice/),
    ).toBeInTheDocument();
    expect(within(desktopGrid).getByText("Studio A")).toBeVisible();
    expect(screen.getByText("6-8 AM")).toBeVisible();
    expect(screen.getByTestId("schedule-time-grid")).toHaveClass("min-w-0");
  });

  it("keeps all-day events in a separate row", () => {
    render(
      <ScheduleTimeGrid
        conflicts={new Map([["rest", ["Rest overlaps a task."]]])}
        days={[day]}
        events={[
          {
            ...eventAt("rest", new Date(2026, 6, 12), new Date(2026, 6, 13)),
            allDay: true,
            title: "Rest day",
          },
        ]}
        members={[member]}
      />,
    );

    const desktopGrid = screen.getByTestId("schedule-time-grid");
    expect(within(desktopGrid).getByText("All day")).toBeVisible();
    expect(within(desktopGrid).getByText("Rest day · Conflict")).toBeVisible();
    expect(screen.getByTestId("all-day-coverage-2026-07-12")).toHaveClass(
      "inset-0",
    );
  });

  it("contains week overflow inside a scrollable calendar canvas", () => {
    render(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={Array.from(
          { length: 7 },
          (_, index) => new Date(2026, 6, 12 + index),
        )}
        events={[]}
        members={[member]}
      />,
    );

    expect(screen.getByTestId("schedule-time-grid")).toHaveClass(
      "min-w-[58rem]",
    );
    expect(screen.getByTestId("schedule-mobile-agenda").children).toHaveLength(
      7,
    );
    expect(screen.getByTestId("schedule-time-grid").parentElement).toHaveClass(
      "overflow-x-auto",
    );
  });
});

function eventAt(id: string, startsAt: Date, endsAt: Date): ScheduleEvent {
  return {
    id,
    familyId: "family-a",
    memberId: member.id,
    memberIds: [member.id],
    taskInstanceId: null,
    createdByMemberId: "member-parent",
    eventType: "extracurricular",
    title: "Dance practice",
    description: null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    allDay: false,
    location: "Studio A",
    color: null,
    createdAt: startsAt.toISOString(),
    updatedAt: startsAt.toISOString(),
  };
}

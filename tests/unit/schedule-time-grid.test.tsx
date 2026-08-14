import { render, screen } from "@testing-library/react";
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
    expect(screen.getByLabelText(/Dance practice/)).toBeInTheDocument();
    expect(screen.getByText("Studio A")).toBeVisible();
    expect(screen.getByText("6-8 AM")).toBeVisible();
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

    expect(screen.getByText("All day")).toBeVisible();
    expect(screen.getByText("Rest day · Conflict")).toBeVisible();
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

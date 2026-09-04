import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleTimeGrid } from "@/components/schedule/schedule-time-grid";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { addCalendarDays } from "@/lib/dates/schedule";

const day = "2026-07-12";
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
    const weekStartsOn = "2026-09-06";
    render(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={Array.from({ length: 7 }, (_, index) =>
          addCalendarDays(weekStartsOn, index),
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
    expect(
      within(screen.getByTestId("schedule-time-grid")).getByText("Sep 6"),
    ).toBeVisible();
    expect(
      within(screen.getByTestId("schedule-time-grid")).getByText("Sep 12"),
    ).toBeVisible();
  });

  it("renders September 12 events under September 12 in Regina", () => {
    render(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={["2026-09-12"]}
        events={[
          eventAt(
            "regina-event",
            new Date("2026-09-12T20:30:00.000Z"),
            new Date("2026-09-12T21:30:00.000Z"),
          ),
        ]}
        members={[member]}
        timeZone="America/Regina"
      />,
    );

    const desktopGrid = screen.getByTestId("schedule-time-grid");
    expect(within(desktopGrid).getByText("Sat")).toBeVisible();
    expect(within(desktopGrid).getByText("Sep 12")).toBeVisible();
    expect(within(desktopGrid).getByLabelText(/Dance practice/)).toBeVisible();
  });

  it("keeps an event crossing Regina midnight on both civil days", () => {
    const lateEvent = {
      ...eventAt(
        "imported-late-event",
        new Date("2026-09-13T05:30:00.000Z"),
        new Date("2026-09-13T06:30:00.000Z"),
      ),
      title: "Imported late practice",
    };
    const { rerender } = render(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={["2026-09-12"]}
        events={[lateEvent]}
        members={[member]}
        timeZone="America/Regina"
      />,
    );

    expect(
      within(screen.getByTestId("schedule-time-grid")).getByLabelText(
        /Imported late practice/,
      ),
    ).toBeVisible();

    rerender(
      <ScheduleTimeGrid
        conflicts={new Map()}
        days={["2026-09-13"]}
        events={[lateEvent]}
        members={[member]}
        timeZone="America/Regina"
      />,
    );

    expect(
      within(screen.getByTestId("schedule-time-grid")).getByLabelText(
        /Imported late practice/,
      ),
    ).toBeVisible();
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

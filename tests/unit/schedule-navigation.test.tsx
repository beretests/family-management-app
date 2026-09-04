import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CalendarDateNavigation,
  CalendarMemberFilter,
  ScheduleViewControls,
} from "@/components/schedule/schedule-navigation";
import type { FamilyMemberWithDetails } from "@/features/family/types";

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

describe("schedule navigation", () => {
  it("uses a mobile member select and keeps desktop member links", () => {
    render(
      <CalendarMemberFilter
        date="2026-09-12"
        members={[member]}
        selectedMemberId={member.id}
        timeZone="America/Regina"
        view="week"
      />,
    );

    const mobileFilter = screen.getByTestId("calendar-member-select");
    expect(mobileFilter).toHaveClass("sm:hidden");
    expect(within(mobileFilter).getByLabelText("Family member")).toHaveValue(
      member.id,
    );
    expect(
      within(mobileFilter).getByRole("option", { name: "Whole family" }),
    ).toHaveValue("");
    expect(
      within(mobileFilter).getByRole("option", { name: "Ari" }),
    ).toHaveValue(member.id);
    expect(mobileFilter).toHaveFormValues({
      date: "2026-09-12",
      member: member.id,
      timeZone: "America/Regina",
      view: "week",
    });
    expect(
      within(mobileFilter).getByRole("button", {
        name: "Apply member filter",
      }),
    ).toBeVisible();

    const desktopFilter = screen.getByTestId("calendar-member-links");
    expect(desktopFilter).toHaveClass("hidden", "sm:flex");
    expect(
      within(desktopFilter).getByRole("link", { name: "Ari" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("keeps date, view, timezone, and member state in calendar controls", () => {
    render(
      <>
        <CalendarDateNavigation
          date="2026-09-12"
          memberId={member.id}
          timeZone="America/Regina"
          today="2026-09-04"
          view="week"
        />
        <ScheduleViewControls
          date="2026-09-12"
          memberId={member.id}
          timeZone="America/Regina"
          view="week"
        />
      </>,
    );

    const dateNavigation = screen.getByRole("navigation", {
      name: "Calendar date navigation",
    });
    expect(
      within(dateNavigation).getByRole("link", { name: "Previous" }),
    ).toHaveAttribute(
      "href",
      "/schedule?date=2026-09-05&view=week&timeZone=America%2FRegina&member=member-a",
    );
    expect(
      within(dateNavigation).getByRole("link", { name: "Today" }),
    ).toHaveAttribute(
      "href",
      "/schedule?date=2026-09-04&view=week&timeZone=America%2FRegina&member=member-a",
    );
    expect(
      within(dateNavigation).getByRole("link", { name: "Next" }),
    ).toHaveAttribute(
      "href",
      "/schedule?date=2026-09-19&view=week&timeZone=America%2FRegina&member=member-a",
    );
    expect(screen.getByRole("link", { name: "Day" })).toHaveAttribute(
      "href",
      "/schedule?date=2026-09-12&view=day&timeZone=America%2FRegina&member=member-a",
    );
    expect(
      screen.getByLabelText("Jump to date").closest("form"),
    ).toHaveFormValues({
      date: "2026-09-12",
      member: member.id,
      timeZone: "America/Regina",
      view: "week",
    });
  });
});

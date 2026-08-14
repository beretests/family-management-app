import { describe, expect, it } from "vitest";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import {
  filterScheduleEventsForMember,
  formatScheduleDuration,
  getScheduleDurationMinutes,
  resolveCalendarMember,
  resolveCalendarView,
} from "@/features/schedule/filters";
import type { ScheduleEvent } from "@/features/schedule/types";

const activeMember = member("active-member", "active");
const inactiveMember = member("inactive-member", "inactive");

describe("resolveCalendarView", () => {
  it("defaults calendar-only mode to the reference-style week view", () => {
    expect(resolveCalendarView(undefined, false)).toBe("week");
  });

  it("preserves the full app's day default and explicit selections", () => {
    expect(resolveCalendarView(undefined, true)).toBe("day");
    expect(resolveCalendarView("day", false)).toBe("day");
    expect(resolveCalendarView("week", true)).toBe("week");
  });
});

describe("resolveCalendarMember", () => {
  it("returns an active selected family member", () => {
    expect(
      resolveCalendarMember(activeMember.id, [activeMember, inactiveMember]),
    ).toBe(activeMember);
  });

  it("falls back to the whole family for missing, invalid, or inactive values", () => {
    expect(resolveCalendarMember(undefined, [activeMember])).toBeNull();
    expect(resolveCalendarMember("family", [activeMember])).toBeNull();
    expect(resolveCalendarMember("unknown", [activeMember])).toBeNull();
    expect(
      resolveCalendarMember(inactiveMember.id, [inactiveMember]),
    ).toBeNull();
  });
});

describe("filterScheduleEventsForMember", () => {
  const wholeFamilyEvent = event("family-event", []);
  const selectedEvent = event("selected-event", [activeMember.id]);
  const sharedEvent = event("shared-event", [activeMember.id, "sibling"]);
  const siblingEvent = event("sibling-event", ["sibling"]);
  const events = [wholeFamilyEvent, selectedEvent, sharedEvent, siblingEvent];

  it("keeps all events in the whole-family view", () => {
    expect(filterScheduleEventsForMember(events, null)).toEqual(events);
  });

  it("keeps the selected member's events and whole-family events", () => {
    expect(filterScheduleEventsForMember(events, activeMember.id)).toEqual([
      wholeFamilyEvent,
      selectedEvent,
      sharedEvent,
    ]);
  });
});

describe("schedule duration", () => {
  it("totals valid timed events and excludes all-day entries", () => {
    const timed = event("timed", [activeMember.id]);
    const allDay = {
      ...event("all-day", []),
      allDay: true,
      endsAt: "2026-07-13T00:00:00.000Z",
    };

    expect(getScheduleDurationMinutes([timed, allDay])).toBe(90);
    expect(formatScheduleDuration(90)).toBe("1 hr 30 min");
    expect(formatScheduleDuration(120)).toBe("2 hr");
    expect(formatScheduleDuration(45)).toBe("45 min");
  });
});

function member(
  id: string,
  lifecycleStatus: "active" | "inactive",
): FamilyMemberWithDetails {
  return {
    id,
    familyId: "family-a",
    profileId: null,
    displayName: id,
    role: "child",
    birthdate: "2018-07-01",
    ageYears: 8,
    abilityLevel: 3,
    color: "#2563eb",
    lifecycleStatus,
    deactivatedAt: lifecycleStatus === "inactive" ? "2026-01-01" : null,
    preferences: null,
    currentStatus: null,
    hasKidModePin: false,
  };
}

function event(id: string, memberIds: string[]): ScheduleEvent {
  return {
    id,
    familyId: "family-a",
    memberId: memberIds[0] ?? null,
    memberIds,
    taskInstanceId: null,
    createdByMemberId: "parent",
    eventType: "extracurricular",
    title: id,
    description: null,
    startsAt: "2026-07-12T18:00:00.000Z",
    endsAt: "2026-07-12T19:30:00.000Z",
    allDay: false,
    location: null,
    color: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

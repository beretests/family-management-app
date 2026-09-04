import { describe, expect, it } from "vitest";
import {
  eventsOverlap,
  findScheduleConflicts,
} from "@/features/schedule/conflicts";
import type { ScheduleEvent } from "@/features/schedule/types";

function event(
  id: string,
  memberIds: string[],
  startsAt: string,
  endsAt: string,
  eventType: ScheduleEvent["eventType"] = "extracurricular",
  allDay = false,
) {
  return {
    allDay,
    id,
    memberId: memberIds[0] ?? null,
    memberIds,
    startsAt,
    endsAt,
    eventType,
  } as Pick<
    ScheduleEvent,
    | "id"
    | "memberId"
    | "memberIds"
    | "startsAt"
    | "endsAt"
    | "eventType"
    | "allDay"
  >;
}

describe("eventsOverlap", () => {
  it("detects overlapping time ranges", () => {
    expect(
      eventsOverlap(
        {
          startsAt: "2026-07-12T15:00:00.000Z",
          endsAt: "2026-07-12T16:00:00.000Z",
        },
        {
          startsAt: "2026-07-12T15:30:00.000Z",
          endsAt: "2026-07-12T16:30:00.000Z",
        },
      ),
    ).toBe(true);
  });

  it("allows adjacent time ranges", () => {
    expect(
      eventsOverlap(
        {
          startsAt: "2026-07-12T15:00:00.000Z",
          endsAt: "2026-07-12T16:00:00.000Z",
        },
        {
          startsAt: "2026-07-12T16:00:00.000Z",
          endsAt: "2026-07-12T17:00:00.000Z",
        },
      ),
    ).toBe(false);
  });
});

describe("findScheduleConflicts", () => {
  it("flags overlaps for the same member only", () => {
    const conflicts = findScheduleConflicts([
      event(
        "event-a",
        ["member-a"],
        "2026-07-12T15:00:00.000Z",
        "2026-07-12T16:00:00.000Z",
      ),
      event(
        "event-b",
        ["member-a", "member-c"],
        "2026-07-12T15:30:00.000Z",
        "2026-07-12T17:00:00.000Z",
      ),
      event(
        "event-c",
        ["member-b"],
        "2026-07-12T15:30:00.000Z",
        "2026-07-12T17:00:00.000Z",
      ),
      event(
        "event-d",
        [],
        "2026-07-12T15:30:00.000Z",
        "2026-07-12T17:00:00.000Z",
      ),
    ]);

    expect(conflicts.get("event-a")).toEqual(["event-b"]);
    expect(conflicts.get("event-b")).toEqual(["event-a"]);
    expect(conflicts.has("event-c")).toBe(false);
    expect(conflicts.has("event-d")).toBe(false);
  });

  it("does not treat No School as an unavailable conflict", () => {
    const conflicts = findScheduleConflicts([
      event(
        "no-school",
        ["member-a"],
        "2026-07-12T06:00:00.000Z",
        "2026-07-13T06:00:00.000Z",
        "no_school",
      ),
      event(
        "practice",
        ["member-a"],
        "2026-07-12T15:30:00.000Z",
        "2026-07-12T17:00:00.000Z",
      ),
    ]);

    expect(conflicts.size).toBe(0);
  });

  it("does not flag all-day events against events on the same day", () => {
    const conflicts = findScheduleConflicts([
      event(
        "all-day-appointment",
        ["member-a"],
        "2026-07-12T06:00:00.000Z",
        "2026-07-13T06:00:00.000Z",
        "appointment",
        true,
      ),
      event(
        "practice",
        ["member-a"],
        "2026-07-12T15:30:00.000Z",
        "2026-07-12T17:00:00.000Z",
      ),
      event(
        "all-day-family-event",
        ["member-a"],
        "2026-07-12T06:00:00.000Z",
        "2026-07-13T06:00:00.000Z",
        "family_event",
        true,
      ),
    ]);

    expect(conflicts.size).toBe(0);
  });
});

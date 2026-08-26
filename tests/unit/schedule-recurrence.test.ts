import { describe, expect, it } from "vitest";
import {
  expandRecurringEvent,
  getRecurrenceOccurrenceNumber,
} from "@/features/schedule/recurrence";
import type {
  ScheduleEvent,
  ScheduleRecurrence,
} from "@/features/schedule/types";

describe("schedule recurrence", () => {
  it("expands a daily event only inside the requested future week", () => {
    const occurrences = expandRecurringEvent(
      recurringEvent({ frequency: "daily" }),
      new Date("2026-08-17T00:00:00.000Z"),
      new Date("2026-08-24T00:00:00.000Z"),
    );

    expect(occurrences).toHaveLength(7);
    expect(occurrences[0]?.sourceEventId).toBe("event-series");
    expect(occurrences[0]?.startsAt).toBe("2026-08-17T16:00:00.000Z");
  });

  it("supports a custom Monday through Friday weekly pattern", () => {
    const occurrences = expandRecurringEvent(
      recurringEvent({ frequency: "weekly", weekdays: [1, 2, 3, 4, 5] }),
      new Date("2026-08-16T00:00:00.000Z"),
      new Date("2026-08-23T00:00:00.000Z"),
    );

    expect(
      occurrences.map((event) => new Date(event.startsAt).getUTCDay()),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it("honors occurrence-count and end-date limits", () => {
    const countLimited = expandRecurringEvent(
      recurringEvent({ frequency: "daily", occurrenceCount: 3 }),
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-09-01T00:00:00.000Z"),
    );
    const dateLimited = expandRecurringEvent(
      recurringEvent({ frequency: "daily", endsOn: "2026-08-12" }),
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-09-01T00:00:00.000Z"),
    );

    expect(countLimited).toHaveLength(3);
    expect(dateLimited).toHaveLength(3);
  });

  it("expands yearly events and skips invalid non-leap anniversaries", () => {
    const event = recurringEvent({ frequency: "yearly" });
    event.startsAt = "2024-02-29T16:00:00.000Z";
    event.endsAt = "2024-02-29T17:00:00.000Z";

    const occurrences = expandRecurringEvent(
      event,
      new Date("2024-01-01T00:00:00.000Z"),
      new Date("2029-01-01T00:00:00.000Z"),
    );

    expect(occurrences.map((item) => item.startsAt.slice(0, 10))).toEqual([
      "2024-02-29",
      "2028-02-29",
    ]);
  });

  it("keeps the local wall-clock time across daylight-saving changes", () => {
    const event = recurringEvent({
      frequency: "weekly",
      timeZone: "America/New_York",
      weekdays: [0],
    });
    event.startsAt = "2026-03-01T14:00:00.000Z";
    event.endsAt = "2026-03-01T15:00:00.000Z";

    const occurrences = expandRecurringEvent(
      event,
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-16T00:00:00.000Z"),
    );

    expect(occurrences.map((item) => item.startsAt)).toEqual([
      "2026-03-01T14:00:00.000Z",
      "2026-03-08T13:00:00.000Z",
      "2026-03-15T13:00:00.000Z",
    ]);
  });

  it("applies modified and cancelled single-occurrence overrides", () => {
    const event = recurringEvent({ frequency: "daily" });
    const occurrences = expandRecurringEvent(
      event,
      new Date("2026-08-10T00:00:00.000Z"),
      new Date("2026-08-14T00:00:00.000Z"),
      [
        {
          id: "override-modified",
          occurrenceDate: "2026-08-11",
          status: "modified",
          memberIds: ["member-b"],
          eventType: "appointment",
          title: "Moved practice",
          description: null,
          startsAt: "2026-08-11T19:00:00.000Z",
          endsAt: "2026-08-11T20:00:00.000Z",
          allDay: false,
          location: "Clinic",
          color: "#2563eb",
          updatedAt: "2026-08-09T00:00:00.000Z",
        },
        {
          id: "override-cancelled",
          occurrenceDate: "2026-08-12",
          status: "cancelled",
          memberIds: [],
          eventType: null,
          title: null,
          description: null,
          startsAt: null,
          endsAt: null,
          allDay: null,
          location: null,
          color: null,
          updatedAt: "2026-08-09T00:00:00.000Z",
        },
      ],
    );

    expect(occurrences).toHaveLength(3);
    expect(
      occurrences.find((item) => item.occurrenceDate === "2026-08-11"),
    ).toMatchObject({
      title: "Moved practice",
      memberIds: ["member-b"],
      occurrenceOverrideId: "override-modified",
    });
    expect(
      occurrences.some((item) => item.occurrenceDate === "2026-08-12"),
    ).toBe(false);
  });

  it("calculates the selected occurrence number for count-limited splits", () => {
    const event = recurringEvent({
      frequency: "weekly",
      weekdays: [1, 3],
    });

    expect(
      getRecurrenceOccurrenceNumber({
        occurrenceDate: "2026-08-19",
        recurrence: event.recurrence!,
        seriesStartsAt: event.startsAt,
      }),
    ).toBe(4);
  });
});

function recurringEvent(overrides: Partial<ScheduleRecurrence>): ScheduleEvent {
  return {
    id: "event-series",
    familyId: "family-a",
    memberId: "member-a",
    memberIds: ["member-a"],
    taskInstanceId: null,
    createdByMemberId: "member-a",
    eventType: "extracurricular",
    title: "Practice",
    description: null,
    startsAt: "2026-08-10T16:00:00.000Z",
    endsAt: "2026-08-10T17:00:00.000Z",
    allDay: false,
    location: null,
    color: null,
    createdAt: "2026-08-10T16:00:00.000Z",
    updatedAt: "2026-08-10T16:00:00.000Z",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      weekdays: [],
      endsOn: null,
      occurrenceCount: null,
      timeZone: "UTC",
      ...overrides,
    },
  };
}

import { describe, expect, it } from "vitest";
import {
  calendarHourHeight,
  getCalendarHourRange,
  layoutCalendarEventsForDay,
} from "@/features/schedule/calendar-layout";
import type { ScheduleEvent } from "@/features/schedule/types";

const day = "2026-07-12";

describe("getCalendarHourRange", () => {
  it("uses family-friendly default hours for an ordinary daytime schedule", () => {
    expect(
      getCalendarHourRange([
        eventAt("daytime", new Date(2026, 6, 12, 9), new Date(2026, 6, 12, 10)),
      ]),
    ).toEqual({ startHour: 6, endHour: 22 });
  });

  it("expands to include early and late scheduled events", () => {
    expect(
      getCalendarHourRange([
        eventAt(
          "early",
          new Date(2026, 6, 12, 5, 30),
          new Date(2026, 6, 12, 6, 30),
        ),
        eventAt(
          "late",
          new Date(2026, 6, 12, 23),
          new Date(2026, 6, 12, 23, 30),
        ),
      ]),
    ).toEqual({ startHour: 5, endHour: 24 });
  });

  it("ignores all-day events when choosing visible hours", () => {
    expect(
      getCalendarHourRange([
        {
          ...eventAt("all-day", new Date(2026, 6, 12), new Date(2026, 6, 13)),
          allDay: true,
        },
      ]),
    ).toEqual({ startHour: 6, endHour: 22 });
  });
});

describe("layoutCalendarEventsForDay", () => {
  it("positions an event from its start time and duration", () => {
    const [layout] = layoutCalendarEventsForDay({
      day,
      startHour: 6,
      endHour: 22,
      events: [
        eventAt(
          "dance",
          new Date(2026, 6, 12, 8, 30),
          new Date(2026, 6, 12, 9, 45),
        ),
      ],
    });

    expect(layout.top).toBe(2.5 * calendarHourHeight);
    expect(layout.height).toBe(1.25 * calendarHourHeight);
    expect(layout.left).toBe(0);
    expect(layout.width).toBe(100);
  });

  it("clips an overnight event to the visible portion of the selected day", () => {
    const [layout] = layoutCalendarEventsForDay({
      day,
      startHour: 6,
      endHour: 22,
      events: [
        eventAt(
          "overnight",
          new Date(2026, 6, 11, 23),
          new Date(2026, 6, 12, 7),
        ),
      ],
    });

    expect(layout.top).toBe(0);
    expect(layout.height).toBe(calendarHourHeight);
  });

  it("places overlapping events in columns and reuses a free column", () => {
    const layouts = layoutCalendarEventsForDay({
      day,
      startHour: 6,
      endHour: 22,
      events: [
        eventAt("long", new Date(2026, 6, 12, 8), new Date(2026, 6, 12, 10)),
        eventAt(
          "first-overlap",
          new Date(2026, 6, 12, 8, 30),
          new Date(2026, 6, 12, 9),
        ),
        eventAt(
          "second-overlap",
          new Date(2026, 6, 12, 9),
          new Date(2026, 6, 12, 10),
        ),
        eventAt("later", new Date(2026, 6, 12, 10), new Date(2026, 6, 12, 11)),
      ],
    });

    expect(
      layouts.map(({ event, left, width }) => ({
        id: event.id,
        left,
        width,
      })),
    ).toEqual([
      { id: "long", left: 0, width: 50 },
      { id: "first-overlap", left: 50, width: 50 },
      { id: "second-overlap", left: 50, width: 50 },
      { id: "later", left: 0, width: 100 },
    ]);
  });

  it("keeps adjacent short cards from visually covering each other", () => {
    const layouts = layoutCalendarEventsForDay({
      day,
      startHour: 6,
      endHour: 22,
      events: [
        eventAt(
          "first-short",
          new Date(2026, 6, 12, 8),
          new Date(2026, 6, 12, 8, 15),
        ),
        eventAt(
          "second-short",
          new Date(2026, 6, 12, 8, 15),
          new Date(2026, 6, 12, 8, 30),
        ),
      ],
    });

    expect(layouts.map(({ left, width }) => ({ left, width }))).toEqual([
      { left: 0, width: 50 },
      { left: 50, width: 50 },
    ]);
  });

  it("positions UTC instants by the requested browser time zone", () => {
    const [layout] = layoutCalendarEventsForDay({
      day: "2026-08-20",
      startHour: 6,
      endHour: 22,
      events: [
        eventAt(
          "regina-afternoon",
          new Date("2026-08-20T22:00:00.000Z"),
          new Date("2026-08-20T23:00:00.000Z"),
        ),
      ],
      timeZone: "America/Regina",
    });

    expect(layout.top).toBe(10 * calendarHourHeight);
    expect(layout.height).toBe(calendarHourHeight);
  });

  it("positions a September 12 Regina event on the selected civil date", () => {
    const [layout] = layoutCalendarEventsForDay({
      day: "2026-09-12",
      startHour: 6,
      endHour: 22,
      events: [
        eventAt(
          "regina-afternoon",
          new Date("2026-09-12T20:30:00.000Z"),
          new Date("2026-09-12T21:30:00.000Z"),
        ),
      ],
      timeZone: "America/Regina",
    });

    expect(layout.top).toBe(8.5 * calendarHourHeight);
    expect(layout.height).toBe(calendarHourHeight);
  });
});

function eventAt(id: string, startsAt: Date, endsAt: Date): ScheduleEvent {
  return {
    id,
    familyId: "family-a",
    memberId: "member-a",
    memberIds: ["member-a"],
    taskInstanceId: null,
    createdByMemberId: "member-parent",
    eventType: "extracurricular",
    title: id,
    description: null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    allDay: false,
    location: null,
    color: "#2563eb",
    createdAt: startsAt.toISOString(),
    updatedAt: startsAt.toISOString(),
  };
}

import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  endOfCalendarWeek,
  formatCalendarDateHeading,
  formatCalendarShortDate,
  formatCalendarWeekday,
  resolveCalendarDate,
  startOfCalendarWeek,
  dateTimeLocalToIso,
  formatTimeRange,
  toDateTimeLocalValue,
} from "@/lib/dates/schedule";
import { startOfZonedDay } from "@/lib/dates/time-zone";

describe("schedule time zones", () => {
  it("keeps a selected Regina calendar date on the same civil day", () => {
    const selectedDate = resolveCalendarDate("2026-09-12", "2026-09-04");

    expect(selectedDate).toBe("2026-09-12");
    expect(formatCalendarWeekday(selectedDate)).toBe("Sat");
    expect(formatCalendarShortDate(selectedDate)).toBe("Sep 12");
    expect(formatCalendarDateHeading(selectedDate)).toBe(
      "Saturday, September 12",
    );
  });

  it("uses stable calendar arithmetic for winter and summer dates", () => {
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addCalendarDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(startOfCalendarWeek("2026-09-12")).toBe("2026-09-06");
    expect(endOfCalendarWeek("2026-09-12")).toBe("2026-09-12");
  });

  it("falls back when a URL contains an invalid calendar date", () => {
    expect(resolveCalendarDate("2026-02-30", "2026-09-04")).toBe("2026-09-04");
  });

  it("stores a browser-local datetime as the matching UTC instant", () => {
    expect(dateTimeLocalToIso("2026-08-20T16:00", "America/Regina")).toBe(
      "2026-08-20T22:00:00.000Z",
    );
  });

  it("round-trips saved instants and formats them in the calendar time zone", () => {
    const startsAt = "2026-08-20T22:00:00.000Z";
    const endsAt = "2026-08-20T23:00:00.000Z";

    expect(toDateTimeLocalValue(startsAt, "America/Regina")).toBe(
      "2026-08-20T16:00",
    );
    expect(formatTimeRange(startsAt, endsAt, false, "America/Regina")).toBe(
      "4:00 PM - 5:00 PM",
    );
  });

  it("uses local midnight for calendar query boundaries", () => {
    expect(startOfZonedDay("2026-01-20", "America/Regina").toISOString()).toBe(
      "2026-01-20T06:00:00.000Z",
    );
    expect(startOfZonedDay("2026-08-20", "America/Regina").toISOString()).toBe(
      "2026-08-20T06:00:00.000Z",
    );
  });
});

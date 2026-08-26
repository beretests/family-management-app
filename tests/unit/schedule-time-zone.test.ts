import { describe, expect, it } from "vitest";
import {
  dateTimeLocalToIso,
  formatTimeRange,
  toDateTimeLocalValue,
} from "@/lib/dates/schedule";
import { startOfZonedDay } from "@/lib/dates/time-zone";

describe("schedule time zones", () => {
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
    expect(startOfZonedDay("2026-08-20", "America/Regina").toISOString()).toBe(
      "2026-08-20T06:00:00.000Z",
    );
  });
});

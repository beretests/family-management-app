import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  normalizeAllDayFormRange,
  normalizeImportedNoSchoolRange,
} from "@/features/schedule/all-day";

describe("all-day schedule ranges", () => {
  it("stores a one-day form range as local midnight to next midnight", () => {
    expect(
      normalizeAllDayFormRange("2026-09-01T16:00", "2026-09-01T17:00"),
    ).toEqual({
      startsAt: "2026-09-01T00:00",
      endsAt: "2026-09-02T00:00",
    });
  });

  it("preserves an exclusive multi-day end date", () => {
    expect(
      normalizeAllDayFormRange("2026-09-01T00:00", "2026-09-04T00:00"),
    ).toEqual({
      startsAt: "2026-09-01T00:00",
      endsAt: "2026-09-04T00:00",
    });
  });

  it("uses calendar arithmetic across month boundaries", () => {
    expect(addDaysToDateKey("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("converts a timed import into a full local No School day", () => {
    expect(
      normalizeImportedNoSchoolRange({
        allDay: false,
        startsAt: "2026-11-01T15:00:00.000Z",
        endsAt: "2026-11-01T17:00:00.000Z",
        timeZone: "America/Regina",
      }),
    ).toEqual({
      startsAt: "2026-11-01T06:00:00.000Z",
      endsAt: "2026-11-02T06:00:00.000Z",
    });
  });
});

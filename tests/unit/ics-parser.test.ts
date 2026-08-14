import { describe, expect, it } from "vitest";
import {
  MAX_ICS_EVENTS,
  MAX_ICS_FILE_BYTES,
  parseIcsCalendar,
} from "@/features/schedule/ics/parser";

describe("ICS calendar parser", () => {
  it("parses UTC timed events and unescapes text", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:utc-event@example.test",
          "DTSTART:20260817T180000Z",
          "DTEND:20260817T193000Z",
          "SUMMARY:Soccer\\, practice",
          "DESCRIPTION:Bring water\\nand cleats",
          "LOCATION:Community Field",
        ]),
      ]),
      { fallbackTimeZone: "America/Regina" },
    );

    expect(preview.readyCount).toBe(1);
    expect(preview.events[0]).toMatchObject({
      uid: "utc-event@example.test",
      title: "Soccer, practice",
      description: "Bring water\nand cleats",
      location: "Community Field",
      startsAt: "2026-08-17T18:00:00.000Z",
      endsAt: "2026-08-17T19:30:00.000Z",
      allDay: false,
      timeZone: "UTC",
      status: "ready",
    });
  });

  it("parses all-day events and applies the RFC one-day default", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:all-day@example.test",
          "DTSTART;VALUE=DATE:20260820",
          "SUMMARY:School holiday",
        ]),
      ]),
      { fallbackTimeZone: "America/Regina" },
    );

    expect(preview.events[0]).toMatchObject({
      startsAt: "2026-08-20T06:00:00.000Z",
      endsAt: "2026-08-21T06:00:00.000Z",
      allDay: true,
      timeZone: "America/Regina",
      warnings: ["No end was provided; one day will be used."],
    });
  });

  it("keeps a default all-day event on local midnights across DST", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:dst-all-day@example.test",
          "DTSTART;VALUE=DATE:20260308",
          "SUMMARY:DST day",
        ]),
      ]),
      { fallbackTimeZone: "America/New_York" },
    );

    expect(preview.events[0]).toMatchObject({
      startsAt: "2026-03-08T05:00:00.000Z",
      endsAt: "2026-03-09T04:00:00.000Z",
    });
  });

  it("uses the supplied browser zone for floating times", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:floating@example.test",
          "DTSTART:20260817T120000",
          "DURATION:PT45M",
          "SUMMARY:Lunch",
        ]),
      ]),
      { fallbackTimeZone: "America/Regina" },
    );

    expect(preview.events[0]).toMatchObject({
      startsAt: "2026-08-17T18:00:00.000Z",
      endsAt: "2026-08-17T18:45:00.000Z",
      timeZone: "America/Regina",
    });
  });

  it("honors valid IANA TZIDs across daylight-saving time", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:new-york@example.test",
          "DTSTART;TZID=America/New_York:20260308T090000",
          "DTEND;TZID=America/New_York:20260308T100000",
          "SUMMARY:Class",
        ]),
      ]),
      { fallbackTimeZone: "America/Regina" },
    );

    expect(preview.events[0]).toMatchObject({
      startsAt: "2026-03-08T13:00:00.000Z",
      endsAt: "2026-03-08T14:00:00.000Z",
      timeZone: "America/New_York",
    });
  });

  it("maps a weekly Monday-through-Friday rule", () => {
    const preview = parseIcsCalendar(
      calendar([
        event([
          "UID:weekdays@example.test",
          "DTSTART;TZID=America/Regina:20260817T160000",
          "DTEND;TZID=America/Regina:20260817T170000",
          "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=10",
          "SUMMARY:Homework time",
        ]),
      ]),
      { fallbackTimeZone: "America/Regina" },
    );

    expect(preview.events[0]?.recurrence).toEqual({
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 2, 3, 4, 5],
      endsOn: null,
      occurrenceCount: 10,
      timeZone: "America/Regina",
    });
  });

  it("marks repeated UIDs in one file as duplicates", () => {
    const first = event([
      "UID:duplicate@example.test",
      "DTSTART:20260817T180000Z",
      "SUMMARY:First",
    ]);
    const second = event([
      "UID:duplicate@example.test",
      "DTSTART:20260818T180000Z",
      "SUMMARY:Second",
    ]);
    const preview = parseIcsCalendar(calendar([first, second]), {
      fallbackTimeZone: "UTC",
    });

    expect(preview.readyCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.events[1]?.reasons).toContain(
      "This UID appears more than once in the file.",
    );
  });

  it.each([
    ["missing UID", ["DTSTART:20260817T180000Z", "SUMMARY:No UID"]],
    [
      "monthly recurrence",
      [
        "UID:monthly@example.test",
        "DTSTART:20260817T180000Z",
        "RRULE:FREQ=MONTHLY",
        "SUMMARY:Monthly",
      ],
    ],
    [
      "recurrence exceptions",
      [
        "UID:exception@example.test",
        "RECURRENCE-ID:20260824T180000Z",
        "DTSTART:20260824T190000Z",
        "SUMMARY:Moved",
      ],
    ],
    [
      "proprietary time zone",
      [
        "UID:windows-zone@example.test",
        "DTSTART;TZID=Central Standard Time:20260817T120000",
        "SUMMARY:Unknown zone",
      ],
    ],
  ])("reports %s without failing the whole preview", (_name, lines) => {
    const preview = parseIcsCalendar(calendar([event(lines)]), {
      fallbackTimeZone: "UTC",
    });

    expect(preview.unsupportedCount).toBe(1);
    expect(preview.events[0]?.status).toBe("unsupported");
    expect(preview.events[0]?.reasons.length).toBeGreaterThan(0);
  });

  it("rejects files above the event and byte limits", () => {
    expect(() =>
      parseIcsCalendar(
        calendar(
          Array.from({ length: MAX_ICS_EVENTS + 1 }, (_, index) =>
            event([
              `UID:${index}@example.test`,
              "DTSTART:20260817T180000Z",
              "SUMMARY:Event",
            ]),
          ),
        ),
        { fallbackTimeZone: "UTC" },
      ),
    ).toThrow(`at most ${MAX_ICS_EVENTS} events`);

    expect(() =>
      parseIcsCalendar(" ".repeat(MAX_ICS_FILE_BYTES + 1), {
        fallbackTimeZone: "UTC",
      }),
    ).toThrow("512 KB or smaller");
  });
});

function calendar(events: string[]) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family App//Tests//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function event(lines: string[]) {
  return ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");
}

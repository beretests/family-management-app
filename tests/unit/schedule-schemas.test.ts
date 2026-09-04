import { describe, expect, it } from "vitest";
import {
  createScheduleEventSchema,
  deleteScheduleEventSchema,
  updateScheduleEventSchema,
} from "@/features/schedule/schemas";

const familyId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";
const eventId = "44444444-4444-4444-8444-444444444444";
const idempotencyKey = "55555555-5555-4555-8555-555555555555";

describe("createScheduleEventSchema", () => {
  it("trims text fields and normalizes optional values", () => {
    const parsed = createScheduleEventSchema.parse({
      familyId,
      idempotencyKey,
      memberIds: [],
      wholeFamily: true,
      eventType: "extracurricular",
      title: "  Soccer practice  ",
      description: "",
      startsAt: "2026-07-12T16:00",
      endsAt: "2026-07-12T17:00",
      allDay: false,
      location: "  Field 2  ",
      color: "",
    });

    expect(parsed.title).toBe("Soccer practice");
    expect(parsed.memberIds).toEqual([]);
    expect(parsed.wholeFamily).toBe(true);
    expect(parsed.description).toBeUndefined();
    expect(parsed.location).toBe("Field 2");
    expect(parsed.color).toBeUndefined();
  });

  it("requires the end time to be after the start time", () => {
    const parsed = createScheduleEventSchema.safeParse({
      familyId,
      idempotencyKey,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "school",
      title: "School",
      description: "",
      startsAt: "2026-07-12T16:00",
      endsAt: "2026-07-12T16:00",
      allDay: false,
      location: "",
      color: "#047857",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a UUID idempotency key for every create request", () => {
    const parsed = createScheduleEventSchema.safeParse({
      familyId,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "school",
      title: "School",
      startsAt: "2026-07-12T08:00",
      endsAt: "2026-07-12T15:00",
      allDay: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts No School only as an all-day event", () => {
    const input = {
      familyId,
      idempotencyKey,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "no_school",
      title: "Teacher development day",
      startsAt: "2026-09-01T00:00",
      endsAt: "2026-09-02T00:00",
      allDay: true,
    };

    expect(createScheduleEventSchema.safeParse(input).success).toBe(true);
    expect(
      createScheduleEventSchema.safeParse({ ...input, allDay: false }).success,
    ).toBe(false);
  });

  it("rejects unsupported event types and colors", () => {
    const parsed = createScheduleEventSchema.safeParse({
      familyId,
      idempotencyKey,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "sports",
      title: "Practice",
      description: "",
      startsAt: "2026-07-12T16:00",
      endsAt: "2026-07-12T17:00",
      allDay: false,
      location: "",
      color: "green",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts custom weekday recurrence and requires selected weekdays", () => {
    const input = {
      familyId,
      idempotencyKey,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "school",
      title: "School run",
      description: "",
      startsAt: "2026-08-17T08:00",
      endsAt: "2026-08-17T09:00",
      allDay: false,
      location: "",
      color: "",
      repeatType: "custom",
      recurrenceInterval: "1",
      recurrenceWeekdays: ["1", "2", "3", "4", "5"],
      recurrenceEndType: "never",
      recurrenceEndsOn: "",
      recurrenceCount: "",
      timeZone: "America/Regina",
    };

    expect(createScheduleEventSchema.parse(input).recurrenceWeekdays).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(
      createScheduleEventSchema.safeParse({
        ...input,
        recurrenceWeekdays: [],
      }).success,
    ).toBe(false);
  });
});

describe("updateScheduleEventSchema", () => {
  it("requires an event id", () => {
    const parsed = updateScheduleEventSchema.parse({
      eventId,
      familyId,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "parent_activity",
      title: "Dentist",
      description: "",
      startsAt: "2026-07-12T10:00",
      endsAt: "2026-07-12T11:00",
      allDay: false,
      location: "",
      color: "#2563eb",
    });

    expect(parsed.eventId).toBe(eventId);
    expect(parsed.memberIds).toEqual([memberId]);
    expect(parsed.eventType).toBe("parent_activity");
  });

  it("requires selected members when whole family is not selected", () => {
    const parsed = updateScheduleEventSchema.safeParse({
      eventId,
      familyId,
      memberIds: [],
      wholeFamily: false,
      eventType: "parent_away",
      title: "Work trip",
      description: "",
      startsAt: "2026-07-12T10:00",
      endsAt: "2026-07-12T11:00",
      allDay: false,
      location: "",
      color: "#2563eb",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires an occurrence date for occurrence and following scopes", () => {
    const input = {
      eventId,
      familyId,
      memberIds: [memberId],
      wholeFamily: false,
      eventType: "extracurricular",
      title: "Practice",
      startsAt: "2026-08-19T16:00",
      endsAt: "2026-08-19T17:00",
      allDay: false,
      repeatType: "weekly",
      recurrenceInterval: 1,
      recurrenceEndType: "never",
      timeZone: "America/Regina",
    };

    expect(
      updateScheduleEventSchema.safeParse({
        ...input,
        editScope: "occurrence",
      }).success,
    ).toBe(false);
    expect(
      updateScheduleEventSchema.safeParse({
        ...input,
        editScope: "following",
        occurrenceDate: "2026-08-19",
        repeatType: "none",
      }).success,
    ).toBe(false);
    expect(
      updateScheduleEventSchema.safeParse({
        ...input,
        editScope: "following",
        occurrenceDate: "2026-08-19",
      }).success,
    ).toBe(true);
  });
});

describe("deleteScheduleEventSchema", () => {
  it("requires family and event ids", () => {
    expect(
      deleteScheduleEventSchema.parse({
        eventId,
        familyId,
      }),
    ).toEqual({ eventId, familyId, editScope: "series" });
  });

  it("requires an occurrence date for deleting part of a series", () => {
    expect(
      deleteScheduleEventSchema.safeParse({
        eventId,
        familyId,
        editScope: "following",
      }).success,
    ).toBe(false);
    expect(
      deleteScheduleEventSchema.safeParse({
        eventId,
        familyId,
        editScope: "following",
        occurrenceDate: "2026-08-19",
      }).success,
    ).toBe(true);
  });
});

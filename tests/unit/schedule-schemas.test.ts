import { describe, expect, it } from "vitest";
import {
  createScheduleEventSchema,
  deleteScheduleEventSchema,
  updateScheduleEventSchema,
} from "@/features/schedule/schemas";

const familyId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";
const eventId = "44444444-4444-4444-8444-444444444444";

describe("createScheduleEventSchema", () => {
  it("trims text fields and normalizes optional values", () => {
    const parsed = createScheduleEventSchema.parse({
      familyId,
      memberId: "",
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
    expect(parsed.memberId).toBeUndefined();
    expect(parsed.description).toBeUndefined();
    expect(parsed.location).toBe("Field 2");
    expect(parsed.color).toBeUndefined();
  });

  it("requires the end time to be after the start time", () => {
    const parsed = createScheduleEventSchema.safeParse({
      familyId,
      memberId,
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

  it("rejects unsupported event types and colors", () => {
    const parsed = createScheduleEventSchema.safeParse({
      familyId,
      memberId,
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
});

describe("updateScheduleEventSchema", () => {
  it("requires an event id", () => {
    const parsed = updateScheduleEventSchema.parse({
      eventId,
      familyId,
      memberId,
      eventType: "appointment",
      title: "Dentist",
      description: "",
      startsAt: "2026-07-12T10:00",
      endsAt: "2026-07-12T11:00",
      allDay: false,
      location: "",
      color: "#2563eb",
    });

    expect(parsed.eventId).toBe(eventId);
  });
});

describe("deleteScheduleEventSchema", () => {
  it("requires family and event ids", () => {
    expect(
      deleteScheduleEventSchema.parse({
        eventId,
        familyId,
      }),
    ).toEqual({ eventId, familyId });
  });
});

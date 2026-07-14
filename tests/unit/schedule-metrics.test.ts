import { describe, expect, it } from "vitest";
import { countUniqueScheduleEvents } from "@/features/schedule/metrics";

describe("countUniqueScheduleEvents", () => {
  it("counts unique schedule events instead of lane appearances", () => {
    expect(
      countUniqueScheduleEvents([
        { id: "event-a" },
        { id: "event-a" },
        { id: "event-b" },
      ]),
    ).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import {
  calculateReviewPoints,
  pointsReviewNote,
} from "@/features/points/ledger";

describe("calculateReviewPoints", () => {
  it("awards full points on first approval", () => {
    expect(
      calculateReviewPoints({
        pointsPossible: 20,
        rejectionCount: 0,
      }),
    ).toBe(20);
  });

  it("reduces points after a rejection", () => {
    expect(
      calculateReviewPoints({
        pointsPossible: 20,
        rejectionCount: 1,
      }),
    ).toBe(15);
  });

  it("does not award negative points", () => {
    expect(
      calculateReviewPoints({
        pointsPossible: 0,
        rejectionCount: 3,
      }),
    ).toBe(0);
  });
});

describe("pointsReviewNote", () => {
  it("summarizes approved task points", () => {
    expect(
      pointsReviewNote({
        pointsAwarded: 1,
        taskTitle: "Sweep Kitchen",
      }),
    ).toBe("Sweep Kitchen approved for 1 point.");
  });
});

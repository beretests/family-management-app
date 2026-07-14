import { describe, expect, it } from "vitest";
import {
  birthMonthToDate,
  birthdateToMonthInput,
  calculateAgeYears,
  resolveMemberAgeYears,
} from "@/lib/dates/age";

describe("age helpers", () => {
  const referenceDate = new Date("2026-07-14T12:00:00Z");

  it("stores birth month as the first day of that month", () => {
    expect(birthMonthToDate({ month: 7, year: 2016 })).toBe("2016-07-01");
  });

  it("formats birthdate for month inputs", () => {
    expect(birthdateToMonthInput("2016-07-01")).toBe("2016-07");
    expect(birthdateToMonthInput(null)).toBe("");
  });

  it("calculates age from month and year", () => {
    expect(calculateAgeYears("2016-07-01", referenceDate)).toBe(10);
    expect(calculateAgeYears("2016-08-01", referenceDate)).toBe(9);
  });

  it("uses static age only as a legacy fallback", () => {
    expect(
      resolveMemberAgeYears({
        ageYears: 8,
        birthdate: "2016-07-01",
        referenceDate,
      }),
    ).toBe(10);
    expect(
      resolveMemberAgeYears({
        ageYears: 8,
        birthdate: null,
        referenceDate,
      }),
    ).toBe(8);
  });
});

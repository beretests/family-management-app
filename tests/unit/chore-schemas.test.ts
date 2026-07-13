import { describe, expect, it } from "vitest";
import {
  createChoreTemplateSchema,
  houseProfileSchema,
} from "@/features/chores/schemas";

const familyId = "22222222-2222-4222-8222-222222222222";

describe("houseProfileSchema", () => {
  it("coerces numeric and checkbox fields", () => {
    const parsed = houseProfileSchema.parse({
      familyId,
      kitchens: "1",
      diningAreas: "1",
      livingRooms: "2",
      halfBathrooms: "1",
      fullBathrooms: "2",
      bedrooms: "3",
      hasLaundryRoom: true,
      hasStairs: false,
      hasEntryway: true,
      hasYard: false,
      hasGarden: false,
      hasGarage: true,
      carChoresEnabled: false,
      groceryChoresEnabled: false,
      petsPresent: false,
    });

    expect(parsed.kitchens).toBe(1);
    expect(parsed.hasGarage).toBe(true);
  });

  it("rejects negative room counts", () => {
    const parsed = houseProfileSchema.safeParse({
      familyId,
      kitchens: "-1",
      diningAreas: "1",
      livingRooms: "1",
      halfBathrooms: "0",
      fullBathrooms: "1",
      bedrooms: "3",
      hasLaundryRoom: false,
      hasStairs: false,
      hasEntryway: true,
      hasYard: false,
      hasGarden: false,
      hasGarage: false,
      carChoresEnabled: false,
      groceryChoresEnabled: false,
      petsPresent: false,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("createChoreTemplateSchema", () => {
  it("normalizes optional text and subtasks", () => {
    const parsed = createChoreTemplateSchema.parse({
      familyId,
      title: "  Sweep Kitchen  ",
      emoji: "",
      description: "",
      category: " kitchen ",
      location: " Kitchen ",
      frequency: "daily",
      estimatedMinutes: "15",
      difficulty: "2",
      basePoints: "15",
      minimumAge: "8",
      maximumAge: "",
      requiresParentReview: true,
      requiresEvidence: false,
      evidenceType: "",
      undesirableScore: "1",
      completionCheckText: "",
      safetyNotes: "",
      active: true,
      subtasks: ["Sweep floor", "Empty trash"],
    });

    expect(parsed.title).toBe("Sweep Kitchen");
    expect(parsed.emoji).toBeUndefined();
    expect(parsed.location).toBe("Kitchen");
    expect(parsed.subtasks).toEqual(["Sweep floor", "Empty trash"]);
  });

  it("rejects evidence type when evidence is disabled", () => {
    const parsed = createChoreTemplateSchema.safeParse({
      familyId,
      title: "Check bathroom",
      emoji: "",
      description: "",
      category: "bathroom",
      location: "",
      frequency: "weekly",
      estimatedMinutes: "20",
      difficulty: "3",
      basePoints: "20",
      minimumAge: "8",
      maximumAge: "",
      requiresParentReview: true,
      requiresEvidence: false,
      evidenceType: "photo",
      undesirableScore: "3",
      completionCheckText: "",
      safetyNotes: "",
      active: true,
      subtasks: [],
    });

    expect(parsed.success).toBe(false);
  });
});

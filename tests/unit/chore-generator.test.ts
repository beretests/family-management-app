import { describe, expect, it } from "vitest";
import {
  generateChoreTemplates,
  recommendedStarterSlugs,
} from "@/features/chores/generator";
import type {
  HouseProfile,
  StarterChoreTemplate,
} from "@/features/chores/types";

const houseProfile: HouseProfile = {
  id: "house-profile",
  familyId: "22222222-2222-4222-8222-222222222222",
  kitchens: 1,
  diningAreas: 1,
  livingRooms: 2,
  halfBathrooms: 1,
  fullBathrooms: 2,
  bedrooms: 3,
  hasLaundryRoom: true,
  hasStairs: true,
  hasEntryway: true,
  hasYard: true,
  hasGarden: false,
  hasGarage: false,
  carChoresEnabled: false,
  groceryChoresEnabled: false,
  petsPresent: false,
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

function starter(slug: string, title: string): StarterChoreTemplate {
  return {
    id: slug,
    slug,
    title,
    emoji: null,
    description: `${title} description`,
    category: "home",
    location: "Home",
    frequency: "weekly",
    estimatedMinutes: 20,
    difficulty: 2,
    basePoints: 20,
    minimumAge: 8,
    maximumAge: null,
    requiresParentReview: true,
    requiresEvidence: false,
    evidenceType: null,
    undesirableScore: 1,
    dependencySlugs: [],
    completionCheckText: null,
    safetyNotes: null,
    active: true,
    subtasks: [
      {
        id: `${slug}-subtask`,
        starterTemplateId: slug,
        position: 1,
        title: `Do ${title}`,
      },
    ],
  };
}

describe("recommendedStarterSlugs", () => {
  it("selects seeded starter templates from house features", () => {
    expect(recommendedStarterSlugs(houseProfile)).toEqual([
      "wash-dishes",
      "sweep-kitchen",
      "clean-gas-cooker",
      "mop-kitchen",
      "clean-living-room",
      "clean-upstairs-living-room",
      "clean-front-entryway",
      "clean-entry-closet",
      "clean-stairs",
      "clean-laundry-room",
      "clean-guest-half-bathroom",
      "clean-bathroom-general",
      "clean-upstairs-full-bathroom",
      "arrange-upstairs-hallway-closet",
    ]);
  });
});

describe("generateChoreTemplates", () => {
  it("copies starter template fields and skips existing titles", () => {
    const generated = generateChoreTemplates({
      existingTitles: ["Wash Dishes"],
      houseProfile,
      starterTemplates: [
        starter("wash-dishes", "Wash Dishes"),
        starter("sweep-kitchen", "Sweep Kitchen"),
      ],
    });

    expect(generated).toHaveLength(1);
    expect(generated[0]).toMatchObject({
      starterSlug: "sweep-kitchen",
      title: "Sweep Kitchen",
      active: true,
      subtasks: ["Do Sweep Kitchen"],
    });
  });
});

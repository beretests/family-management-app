import type {
  GeneratedChoreTemplate,
  HouseProfile,
  StarterChoreTemplate,
} from "@/features/chores/types";

const baseDailySlugs = ["wash-dishes", "sweep-kitchen"] as const;
const kitchenWeeklySlugs = ["clean-gas-cooker", "mop-kitchen"] as const;

function addSlug(slugs: Set<string>, slug: string, count = 1) {
  if (count > 0) {
    slugs.add(slug);
  }
}

export function recommendedStarterSlugs(profile: HouseProfile) {
  const slugs = new Set<string>();

  for (const slug of baseDailySlugs) {
    addSlug(slugs, slug, profile.kitchens);
  }

  for (const slug of kitchenWeeklySlugs) {
    addSlug(slugs, slug, profile.kitchens);
  }

  addSlug(slugs, "clean-living-room", profile.livingRooms);
  addSlug(slugs, "clean-upstairs-living-room", Math.max(profile.livingRooms - 1, 0));
  addSlug(slugs, "clean-front-entryway", profile.hasEntryway ? 1 : 0);
  addSlug(slugs, "clean-entry-closet", profile.hasEntryway ? 1 : 0);
  addSlug(slugs, "clean-stairs", profile.hasStairs ? 1 : 0);
  addSlug(slugs, "clean-laundry-room", profile.hasLaundryRoom ? 1 : 0);
  addSlug(slugs, "clean-guest-half-bathroom", profile.halfBathrooms);
  addSlug(slugs, "clean-bathroom-general", profile.fullBathrooms);
  addSlug(
    slugs,
    "clean-upstairs-full-bathroom",
    Math.max(profile.fullBathrooms - 1, 0),
  );
  addSlug(slugs, "arrange-upstairs-hallway-closet", profile.bedrooms);

  return Array.from(slugs);
}

export function generateChoreTemplates({
  existingTitles,
  houseProfile,
  starterTemplates,
}: {
  existingTitles: string[];
  houseProfile: HouseProfile;
  starterTemplates: StarterChoreTemplate[];
}) {
  const existingTitleSet = new Set(
    existingTitles.map((title) => title.trim().toLowerCase()),
  );
  const starterBySlug = new Map(
    starterTemplates.map((template) => [template.slug, template]),
  );

  return recommendedStarterSlugs(houseProfile)
    .map((slug) => starterBySlug.get(slug))
    .filter((template): template is StarterChoreTemplate => Boolean(template))
    .filter((template) => !existingTitleSet.has(template.title.toLowerCase()))
    .map<GeneratedChoreTemplate>((template) => ({
      starterSlug: template.slug,
      title: template.title,
      emoji: template.emoji,
      description: template.description,
      category: template.category,
      location: template.location,
      frequency: template.frequency,
      estimatedMinutes: template.estimatedMinutes,
      difficulty: template.difficulty,
      basePoints: template.basePoints,
      minimumAge: template.minimumAge,
      maximumAge: template.maximumAge,
      requiresParentReview: template.requiresParentReview,
      requiresEvidence: template.requiresEvidence,
      evidenceType: template.evidenceType,
      undesirableScore: template.undesirableScore,
      dependencyTemplateIds: [],
      dependencySlugs: template.dependencySlugs,
      completionCheckText: template.completionCheckText,
      safetyNotes: template.safetyNotes,
      active: true,
      subtasks: template.subtasks.map((subtask) => subtask.title),
    }));
}

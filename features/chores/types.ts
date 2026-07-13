export type ChoreFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "seasonal"
  | "ad_hoc";

export type EvidenceType = "photo" | "note";

export type HouseProfile = {
  id: string;
  familyId: string;
  kitchens: number;
  diningAreas: number;
  livingRooms: number;
  halfBathrooms: number;
  fullBathrooms: number;
  bedrooms: number;
  hasLaundryRoom: boolean;
  hasStairs: boolean;
  hasEntryway: boolean;
  hasYard: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  carChoresEnabled: boolean;
  groceryChoresEnabled: boolean;
  petsPresent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StarterChoreTemplate = {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  description: string | null;
  category: string;
  location: string | null;
  frequency: ChoreFrequency;
  estimatedMinutes: number;
  difficulty: number;
  basePoints: number;
  minimumAge: number;
  maximumAge: number | null;
  requiresParentReview: boolean;
  requiresEvidence: boolean;
  evidenceType: EvidenceType | null;
  undesirableScore: number;
  dependencySlugs: string[];
  completionCheckText: string | null;
  safetyNotes: string | null;
  active: boolean;
  subtasks: StarterChoreSubtask[];
};

export type StarterChoreSubtask = {
  id: string;
  starterTemplateId: string;
  position: number;
  title: string;
};

export type ChoreTemplate = {
  id: string;
  familyId: string;
  title: string;
  emoji: string | null;
  description: string | null;
  category: string;
  location: string | null;
  frequency: ChoreFrequency;
  estimatedMinutes: number;
  difficulty: number;
  basePoints: number;
  minimumAge: number;
  maximumAge: number | null;
  requiresParentReview: boolean;
  requiresEvidence: boolean;
  evidenceType: EvidenceType | null;
  undesirableScore: number;
  dependencyTemplateIds: string[];
  completionCheckText: string | null;
  safetyNotes: string | null;
  active: boolean;
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: ChoreTemplateSubtask[];
};

export type ChoreTemplateSubtask = {
  id: string;
  familyId: string;
  templateId: string;
  position: number;
  title: string;
};

export type GeneratedChoreTemplate = Omit<
  ChoreTemplate,
  "id" | "familyId" | "createdByMemberId" | "createdAt" | "updatedAt" | "subtasks"
> & {
  starterSlug: string;
  dependencySlugs: string[];
  subtasks: string[];
};

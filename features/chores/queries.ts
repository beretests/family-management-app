import { createClient } from "@/lib/supabase/server";
import type {
  ChoreFrequency,
  ChoreTemplate,
  ChoreTemplateSubtask,
  EvidenceType,
  HouseProfile,
  StarterChoreSubtask,
  StarterChoreTemplate,
} from "@/features/chores/types";

type HouseProfileRow = {
  id: string;
  family_id: string;
  kitchens: number;
  dining_areas: number;
  living_rooms: number;
  half_bathrooms: number;
  full_bathrooms: number;
  bedrooms: number;
  has_laundry_room: boolean;
  has_stairs: boolean;
  has_entryway: boolean;
  has_yard: boolean;
  has_garden: boolean;
  has_garage: boolean;
  car_chores_enabled: boolean;
  grocery_chores_enabled: boolean;
  pets_present: boolean;
  created_at: string;
  updated_at: string;
};

type StarterChoreTemplateRow = {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  description: string | null;
  category: string;
  location: string | null;
  frequency: ChoreFrequency;
  estimated_minutes: number;
  difficulty: number;
  base_points: number;
  minimum_age: number;
  maximum_age: number | null;
  requires_parent_review: boolean;
  requires_evidence: boolean;
  evidence_type: EvidenceType | null;
  undesirable_score: number;
  dependency_slugs: string[];
  completion_check_text: string | null;
  safety_notes: string | null;
  active: boolean;
};

type StarterChoreSubtaskRow = {
  id: string;
  starter_template_id: string;
  position: number;
  title: string;
};

type ChoreTemplateRow = {
  id: string;
  family_id: string;
  title: string;
  emoji: string | null;
  description: string | null;
  category: string;
  location: string | null;
  frequency: ChoreFrequency;
  estimated_minutes: number;
  difficulty: number;
  base_points: number;
  minimum_age: number;
  maximum_age: number | null;
  requires_parent_review: boolean;
  requires_evidence: boolean;
  evidence_type: EvidenceType | null;
  undesirable_score: number;
  dependency_template_ids: string[];
  completion_check_text: string | null;
  safety_notes: string | null;
  active: boolean;
  created_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

type ChoreTemplateSubtaskRow = {
  id: string;
  family_id: string;
  template_id: string;
  position: number;
  title: string;
};

function mapHouseProfile(row: HouseProfileRow): HouseProfile {
  return {
    id: row.id,
    familyId: row.family_id,
    kitchens: row.kitchens,
    diningAreas: row.dining_areas,
    livingRooms: row.living_rooms,
    halfBathrooms: row.half_bathrooms,
    fullBathrooms: row.full_bathrooms,
    bedrooms: row.bedrooms,
    hasLaundryRoom: row.has_laundry_room,
    hasStairs: row.has_stairs,
    hasEntryway: row.has_entryway,
    hasYard: row.has_yard,
    hasGarden: row.has_garden,
    hasGarage: row.has_garage,
    carChoresEnabled: row.car_chores_enabled,
    groceryChoresEnabled: row.grocery_chores_enabled,
    petsPresent: row.pets_present,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStarterSubtask(row: StarterChoreSubtaskRow): StarterChoreSubtask {
  return {
    id: row.id,
    starterTemplateId: row.starter_template_id,
    position: row.position,
    title: row.title,
  };
}

function mapStarterTemplate(
  row: StarterChoreTemplateRow,
  subtasks: StarterChoreSubtask[],
): StarterChoreTemplate {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    category: row.category,
    location: row.location,
    frequency: row.frequency,
    estimatedMinutes: row.estimated_minutes,
    difficulty: row.difficulty,
    basePoints: row.base_points,
    minimumAge: row.minimum_age,
    maximumAge: row.maximum_age,
    requiresParentReview: row.requires_parent_review,
    requiresEvidence: row.requires_evidence,
    evidenceType: row.evidence_type,
    undesirableScore: row.undesirable_score,
    dependencySlugs: row.dependency_slugs,
    completionCheckText: row.completion_check_text,
    safetyNotes: row.safety_notes,
    active: row.active,
    subtasks,
  };
}

function mapTemplateSubtask(row: ChoreTemplateSubtaskRow): ChoreTemplateSubtask {
  return {
    id: row.id,
    familyId: row.family_id,
    templateId: row.template_id,
    position: row.position,
    title: row.title,
  };
}

function mapTemplate(
  row: ChoreTemplateRow,
  subtasks: ChoreTemplateSubtask[],
): ChoreTemplate {
  return {
    id: row.id,
    familyId: row.family_id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    category: row.category,
    location: row.location,
    frequency: row.frequency,
    estimatedMinutes: row.estimated_minutes,
    difficulty: row.difficulty,
    basePoints: row.base_points,
    minimumAge: row.minimum_age,
    maximumAge: row.maximum_age,
    requiresParentReview: row.requires_parent_review,
    requiresEvidence: row.requires_evidence,
    evidenceType: row.evidence_type,
    undesirableScore: row.undesirable_score,
    dependencyTemplateIds: row.dependency_template_ids,
    completionCheckText: row.completion_check_text,
    safetyNotes: row.safety_notes,
    active: row.active,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subtasks,
  };
}

export function getDefaultHouseProfile(familyId: string): HouseProfile {
  const now = new Date(0).toISOString();

  return {
    id: "",
    familyId,
    kitchens: 1,
    diningAreas: 1,
    livingRooms: 1,
    halfBathrooms: 0,
    fullBathrooms: 1,
    bedrooms: 3,
    hasLaundryRoom: false,
    hasStairs: false,
    hasEntryway: true,
    hasYard: false,
    hasGarden: false,
    hasGarage: false,
    carChoresEnabled: false,
    groceryChoresEnabled: false,
    petsPresent: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getHouseProfile(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("house_profiles")
    .select(
      "id,family_id,kitchens,dining_areas,living_rooms,half_bathrooms,full_bathrooms,bedrooms,has_laundry_room,has_stairs,has_entryway,has_yard,has_garden,has_garage,car_chores_enabled,grocery_chores_enabled,pets_present,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapHouseProfile(data as HouseProfileRow) : null;
}

export async function getStarterChoreTemplates() {
  const supabase = await createClient();
  const { data: templateRows, error: templateError } = await supabase
    .from("starter_chore_templates")
    .select(
      "id,slug,title,emoji,description,category,location,frequency,estimated_minutes,difficulty,base_points,minimum_age,maximum_age,requires_parent_review,requires_evidence,evidence_type,undesirable_score,dependency_slugs,completion_check_text,safety_notes,active",
    )
    .eq("active", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (templateError) {
    throw new Error(templateError.message);
  }

  const { data: subtaskRows, error: subtaskError } = await supabase
    .from("starter_chore_template_subtasks")
    .select("id,starter_template_id,position,title")
    .order("position", { ascending: true });

  if (subtaskError) {
    throw new Error(subtaskError.message);
  }

  const subtasksByTemplate = new Map<string, StarterChoreSubtask[]>();

  for (const row of (subtaskRows ?? []) as StarterChoreSubtaskRow[]) {
    const subtasks = subtasksByTemplate.get(row.starter_template_id) ?? [];
    subtasks.push(mapStarterSubtask(row));
    subtasksByTemplate.set(row.starter_template_id, subtasks);
  }

  return ((templateRows ?? []) as StarterChoreTemplateRow[]).map((row) =>
    mapStarterTemplate(row, subtasksByTemplate.get(row.id) ?? []),
  );
}

export async function getChoreTemplates(familyId: string) {
  const supabase = await createClient();
  const { data: templateRows, error: templateError } = await supabase
    .from("chore_templates")
    .select(
      "id,family_id,title,emoji,description,category,location,frequency,estimated_minutes,difficulty,base_points,minimum_age,maximum_age,requires_parent_review,requires_evidence,evidence_type,undesirable_score,dependency_template_ids,completion_check_text,safety_notes,active,created_by_member_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("active", { ascending: false })
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (templateError) {
    throw new Error(templateError.message);
  }

  const { data: subtaskRows, error: subtaskError } = await supabase
    .from("chore_template_subtasks")
    .select("id,family_id,template_id,position,title")
    .eq("family_id", familyId)
    .order("position", { ascending: true });

  if (subtaskError) {
    throw new Error(subtaskError.message);
  }

  const subtasksByTemplate = new Map<string, ChoreTemplateSubtask[]>();

  for (const row of (subtaskRows ?? []) as ChoreTemplateSubtaskRow[]) {
    const subtasks = subtasksByTemplate.get(row.template_id) ?? [];
    subtasks.push(mapTemplateSubtask(row));
    subtasksByTemplate.set(row.template_id, subtasks);
  }

  return ((templateRows ?? []) as ChoreTemplateRow[]).map((row) =>
    mapTemplate(row, subtasksByTemplate.get(row.id) ?? []),
  );
}

"use server";

import { revalidatePath } from "next/cache";
import {
  createChoreTemplateSchema,
  deleteChoreTemplateSchema,
  generateChoreTemplatesSchema,
  houseProfileSchema,
  updateChoreTemplateSchema,
} from "@/features/chores/schemas";
import { generateChoreTemplates } from "@/features/chores/generator";
import {
  getChoreTemplates,
  getDefaultHouseProfile,
  getHouseProfile,
  getStarterChoreTemplates,
} from "@/features/chores/queries";
import type { ChoreTemplate } from "@/features/chores/types";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type ChoreActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getSubtasks(formData: FormData) {
  return getString(formData, "subtasks")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function readHouseProfileForm(formData: FormData) {
  return {
    familyId: getString(formData, "familyId"),
    kitchens: getString(formData, "kitchens"),
    diningAreas: getString(formData, "diningAreas"),
    livingRooms: getString(formData, "livingRooms"),
    halfBathrooms: getString(formData, "halfBathrooms"),
    fullBathrooms: getString(formData, "fullBathrooms"),
    bedrooms: getString(formData, "bedrooms"),
    hasLaundryRoom: getBoolean(formData, "hasLaundryRoom"),
    hasStairs: getBoolean(formData, "hasStairs"),
    hasEntryway: getBoolean(formData, "hasEntryway"),
    hasYard: getBoolean(formData, "hasYard"),
    hasGarden: getBoolean(formData, "hasGarden"),
    hasGarage: getBoolean(formData, "hasGarage"),
    carChoresEnabled: getBoolean(formData, "carChoresEnabled"),
    groceryChoresEnabled: getBoolean(formData, "groceryChoresEnabled"),
    petsPresent: getBoolean(formData, "petsPresent"),
  };
}

function readTemplateForm(formData: FormData) {
  return {
    familyId: getString(formData, "familyId"),
    title: getString(formData, "title"),
    emoji: getString(formData, "emoji"),
    description: getString(formData, "description"),
    category: getString(formData, "category"),
    location: getString(formData, "location"),
    frequency: getString(formData, "frequency"),
    estimatedMinutes: getString(formData, "estimatedMinutes"),
    difficulty: getString(formData, "difficulty"),
    basePoints: getString(formData, "basePoints"),
    minimumAge: getString(formData, "minimumAge"),
    maximumAge: getString(formData, "maximumAge"),
    requiresParentReview: getBoolean(formData, "requiresParentReview"),
    requiresEvidence: getBoolean(formData, "requiresEvidence"),
    evidenceType: getString(formData, "evidenceType"),
    undesirableScore: getString(formData, "undesirableScore"),
    completionCheckText: getString(formData, "completionCheckText"),
    safetyNotes: getString(formData, "safetyNotes"),
    active: getBoolean(formData, "active"),
    subtasks: getSubtasks(formData),
  };
}

async function insertAuditEvent({
  action,
  actorMemberId,
  familyId,
  supabase,
  target,
}: {
  action: string;
  actorMemberId: string;
  familyId: string;
  supabase: AppSupabaseClient;
  target: Record<string, unknown>;
}) {
  await supabase.from("audit_events").insert({
    action,
    actor_member_id: actorMemberId,
    family_id: familyId,
    metadata: target,
  });
}

async function replaceSubtasks({
  familyId,
  subtasks,
  supabase,
  templateId,
}: {
  familyId: string;
  subtasks: string[];
  supabase: AppSupabaseClient;
  templateId: string;
}) {
  const { error: deleteError } = await supabase
    .from("chore_template_subtasks")
    .delete()
    .eq("family_id", familyId)
    .eq("template_id", templateId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (subtasks.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("chore_template_subtasks")
    .insert(
      subtasks.map((title, index) => ({
        family_id: familyId,
        template_id: templateId,
        position: index + 1,
        title,
      })),
    );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function saveHouseProfile(
  _previousState: ChoreActionState,
  formData: FormData,
): Promise<ChoreActionState> {
  const parsed = houseProfileSchema.safeParse(readHouseProfileForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase.from("house_profiles").upsert(
      {
        family_id: parent.familyId,
        kitchens: parsed.data.kitchens,
        dining_areas: parsed.data.diningAreas,
        living_rooms: parsed.data.livingRooms,
        half_bathrooms: parsed.data.halfBathrooms,
        full_bathrooms: parsed.data.fullBathrooms,
        bedrooms: parsed.data.bedrooms,
        has_laundry_room: parsed.data.hasLaundryRoom,
        has_stairs: parsed.data.hasStairs,
        has_entryway: parsed.data.hasEntryway,
        has_yard: parsed.data.hasYard,
        has_garden: parsed.data.hasGarden,
        has_garage: parsed.data.hasGarage,
        car_chores_enabled: parsed.data.carChoresEnabled,
        grocery_chores_enabled: parsed.data.groceryChoresEnabled,
        pets_present: parsed.data.petsPresent,
      },
      { onConflict: "family_id" },
    );

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "house_profile.saved",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { familyId: parent.familyId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");
  return { success: "House profile saved." };
}

export async function generateFamilyChoreTemplates(
  _previousState: ChoreActionState,
  formData: FormData,
): Promise<ChoreActionState> {
  const parsed = generateChoreTemplatesSchema.safeParse({
    familyId: getString(formData, "familyId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Missing family." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const [houseProfile, starterTemplates, existingTemplates] = await Promise.all([
      getHouseProfile(parent.familyId),
      getStarterChoreTemplates(),
      getChoreTemplates(parent.familyId),
    ]);
    const generated = generateChoreTemplates({
      existingTitles: existingTemplates.map((template) => template.title),
      houseProfile: houseProfile ?? getDefaultHouseProfile(parent.familyId),
      starterTemplates,
    });

    if (generated.length === 0) {
      return { success: "No new chore templates to add." };
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from("chore_templates")
      .insert(
        generated.map((template) => ({
          family_id: parent.familyId,
          title: template.title,
          emoji: template.emoji,
          description: template.description,
          category: template.category,
          location: template.location,
          frequency: template.frequency,
          estimated_minutes: template.estimatedMinutes,
          difficulty: template.difficulty,
          base_points: template.basePoints,
          minimum_age: template.minimumAge,
          maximum_age: template.maximumAge,
          requires_parent_review: template.requiresParentReview,
          requires_evidence: template.requiresEvidence,
          evidence_type: template.evidenceType,
          undesirable_score: template.undesirableScore,
          dependency_template_ids: [],
          completion_check_text: template.completionCheckText,
          safety_notes: template.safetyNotes,
          active: true,
          created_by_member_id: parent.memberId,
        })),
      )
      .select("id,title");

    if (insertError) {
      return { error: insertError.message };
    }

    const inserted = (insertedRows ?? []) as Pick<ChoreTemplate, "id" | "title">[];
    const titleToId = new Map([
      ...existingTemplates.map((template) => [template.title, template.id] as const),
      ...inserted.map((template) => [template.title, template.id] as const),
    ]);
    const slugToId = new Map(
      generated.map((template) => [
        template.starterSlug,
        titleToId.get(template.title),
      ]),
    );

    for (const template of generated) {
      const templateId = titleToId.get(template.title);

      if (!templateId) {
        continue;
      }

      await replaceSubtasks({
        familyId: parent.familyId,
        subtasks: template.subtasks,
        supabase,
        templateId,
      });

      const dependencyTemplateIds = template.dependencySlugs
        .map((slug) => slugToId.get(slug))
        .filter((id): id is string => Boolean(id));

      if (dependencyTemplateIds.length > 0) {
        const { error } = await supabase
          .from("chore_templates")
          .update({ dependency_template_ids: dependencyTemplateIds })
          .eq("family_id", parent.familyId)
          .eq("id", templateId);

        if (error) {
          return { error: error.message };
        }
      }
    }

    await insertAuditEvent({
      action: "chore_templates.generated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { count: generated.length },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");
  return { success: "Chore templates generated." };
}

export async function createChoreTemplate(
  _previousState: ChoreActionState,
  formData: FormData,
): Promise<ChoreActionState> {
  const parsed = createChoreTemplateSchema.safeParse(readTemplateForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const templateId = crypto.randomUUID();
    const { error } = await supabase.from("chore_templates").insert({
      id: templateId,
      family_id: parent.familyId,
      title: parsed.data.title,
      emoji: parsed.data.emoji ?? null,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      location: parsed.data.location ?? null,
      frequency: parsed.data.frequency,
      estimated_minutes: parsed.data.estimatedMinutes,
      difficulty: parsed.data.difficulty,
      base_points: parsed.data.basePoints,
      minimum_age: parsed.data.minimumAge,
      maximum_age: parsed.data.maximumAge ?? null,
      requires_parent_review: parsed.data.requiresParentReview,
      requires_evidence: parsed.data.requiresEvidence,
      evidence_type: parsed.data.evidenceType ?? null,
      undesirable_score: parsed.data.undesirableScore,
      completion_check_text: parsed.data.completionCheckText ?? null,
      safety_notes: parsed.data.safetyNotes ?? null,
      active: parsed.data.active,
      created_by_member_id: parent.memberId,
    });

    if (error) {
      return { error: error.message };
    }

    await replaceSubtasks({
      familyId: parent.familyId,
      subtasks: parsed.data.subtasks,
      supabase,
      templateId,
    });

    await insertAuditEvent({
      action: "chore_template.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { templateId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");
  return { success: "Chore template created." };
}

export async function updateChoreTemplate(
  _previousState: ChoreActionState,
  formData: FormData,
): Promise<ChoreActionState> {
  const parsed = updateChoreTemplateSchema.safeParse({
    ...readTemplateForm(formData),
    templateId: getString(formData, "templateId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase
      .from("chore_templates")
      .update({
        title: parsed.data.title,
        emoji: parsed.data.emoji ?? null,
        description: parsed.data.description ?? null,
        category: parsed.data.category,
        location: parsed.data.location ?? null,
        frequency: parsed.data.frequency,
        estimated_minutes: parsed.data.estimatedMinutes,
        difficulty: parsed.data.difficulty,
        base_points: parsed.data.basePoints,
        minimum_age: parsed.data.minimumAge,
        maximum_age: parsed.data.maximumAge ?? null,
        requires_parent_review: parsed.data.requiresParentReview,
        requires_evidence: parsed.data.requiresEvidence,
        evidence_type: parsed.data.evidenceType ?? null,
        undesirable_score: parsed.data.undesirableScore,
        completion_check_text: parsed.data.completionCheckText ?? null,
        safety_notes: parsed.data.safetyNotes ?? null,
        active: parsed.data.active,
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.templateId);

    if (error) {
      return { error: error.message };
    }

    await replaceSubtasks({
      familyId: parent.familyId,
      subtasks: parsed.data.subtasks,
      supabase,
      templateId: parsed.data.templateId,
    });

    await insertAuditEvent({
      action: "chore_template.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { templateId: parsed.data.templateId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");
  return { success: "Chore template updated." };
}

export async function deleteChoreTemplate(
  _previousState: ChoreActionState,
  formData: FormData,
): Promise<ChoreActionState> {
  const parsed = deleteChoreTemplateSchema.safeParse({
    familyId: getString(formData, "familyId"),
    templateId: getString(formData, "templateId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase
      .from("chore_templates")
      .delete()
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.templateId);

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "chore_template.deleted",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { templateId: parsed.data.templateId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");
  return { success: "Chore template deleted." };
}

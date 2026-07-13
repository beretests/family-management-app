"use server";

import { revalidatePath } from "next/cache";
import { createAssignmentsSchema } from "@/features/assignments/schemas";
import { buildSubtaskSnapshot } from "@/features/assignments/engine";
import { getChoreTemplates } from "@/features/chores/queries";
import { endOfDay, startOfDay } from "@/lib/dates/schedule";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type AssignmentActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ChildMemberRow = {
  id: string;
  display_name: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readSelections(formData: FormData) {
  return Array.from(formData.entries())
    .filter(([key]) => key.startsWith("assignee:"))
    .map(([key, value]) => ({
      memberId: typeof value === "string" ? value : "",
      templateId: key.replace("assignee:", ""),
    }))
    .filter((selection) => selection.memberId !== "");
}

function readReasons(formData: FormData) {
  return new Map(
    Array.from(formData.entries())
      .filter(
        ([key, value]) =>
          key.startsWith("reason:") && typeof value === "string",
      )
      .map(([key, value]) => [
        key.replace("reason:", ""),
        String(value).slice(0, 500),
      ]),
  );
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
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

export async function createAssignments(
  _previousState: AssignmentActionState,
  formData: FormData,
): Promise<AssignmentActionState> {
  const parsed = createAssignmentsSchema.safeParse({
    assignmentDate: getString(formData, "assignmentDate"),
    dueTime: getString(formData, "dueTime"),
    familyId: getString(formData, "familyId"),
    selections: readSelections(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const dueAt = combineDateAndTime(
    parsed.data.assignmentDate,
    parsed.data.dueTime,
  );
  const assignmentReasons = readReasons(formData);
  const dayStart = startOfDay(dueAt);
  const dayEnd = endOfDay(dueAt);
  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const [templates, childRowsResult] = await Promise.all([
      getChoreTemplates(parent.familyId),
      supabase
        .from("family_members")
        .select("id,display_name")
        .eq("family_id", parent.familyId)
        .eq("role", "child")
        .eq("lifecycle_status", "active"),
    ]);

    if (childRowsResult.error) {
      return { error: childRowsResult.error.message };
    }

    const childrenById = new Map(
      ((childRowsResult.data ?? []) as ChildMemberRow[]).map((member) => [
        member.id,
        member,
      ]),
    );
    const templatesById = new Map(
      templates
        .filter((template) => template.active)
        .map((template) => [template.id, template]),
    );
    const validSelections = parsed.data.selections.filter(
      (selection) =>
        childrenById.has(selection.memberId) &&
        templatesById.has(selection.templateId),
    );

    if (validSelections.length === 0) {
      return { error: "Choose at least one valid assignment." };
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("task_instances")
      .select("template_id")
      .eq("family_id", parent.familyId)
      .gte("due_at", dayStart.toISOString())
      .lte("due_at", dayEnd.toISOString())
      .in("status", ["draft", "assigned", "in_progress", "submitted"]);

    if (existingError) {
      return { error: existingError.message };
    }

    const existingTemplateIds = new Set(
      ((existingRows ?? []) as { template_id: string | null }[])
        .map((row) => row.template_id)
        .filter((id): id is string => Boolean(id)),
    );
    const newSelections = validSelections.filter(
      (selection) => !existingTemplateIds.has(selection.templateId),
    );

    if (newSelections.length === 0) {
      return { success: "Assignments already exist for this day." };
    }

    const taskRows = newSelections.map((selection) => {
      const template = templatesById.get(selection.templateId);
      const member = childrenById.get(selection.memberId);

      if (!template || !member) {
        throw new Error("Assignment data changed. Refresh and try again.");
      }

      return {
        assigned_to_member_id: member.id,
        assignment_reason:
          assignmentReasons.get(template.id) ??
          `${member.display_name}: parent-selected assignment.`,
        available_from: dayStart.toISOString(),
        created_by_member_id: parent.memberId,
        difficulty_snapshot: template.difficulty,
        due_at: dueAt.toISOString(),
        estimated_minutes_snapshot: template.estimatedMinutes,
        family_id: parent.familyId,
        is_undesirable: template.undesirableScore >= 3,
        points_possible: template.basePoints,
        status: "assigned" as const,
        subtasks_snapshot: buildSubtaskSnapshot(template),
        template_id: template.id,
        title_snapshot: template.title,
      };
    });

    const { data: insertedRows, error: insertError } = await supabase
      .from("task_instances")
      .insert(taskRows)
      .select("id,template_id");

    if (insertError) {
      return { error: insertError.message };
    }

    const insertedByTemplateId = new Map(
      ((insertedRows ?? []) as { id: string; template_id: string | null }[])
        .filter((row) => row.template_id)
        .map((row) => [row.template_id as string, row.id]),
    );
    const subtaskRows = newSelections.flatMap((selection) => {
      const template = templatesById.get(selection.templateId);
      const taskInstanceId = insertedByTemplateId.get(selection.templateId);

      if (!template || !taskInstanceId) {
        return [];
      }

      return buildSubtaskSnapshot(template).map((subtask) => ({
        family_id: parent.familyId,
        position: subtask.position,
        task_instance_id: taskInstanceId,
        title: subtask.title,
      }));
    });

    if (subtaskRows.length > 0) {
      const { error: subtaskError } = await supabase
        .from("task_instance_subtasks")
        .insert(subtaskRows);

      if (subtaskError) {
        return { error: subtaskError.message };
      }
    }

    await insertAuditEvent({
      action: "task_assignments.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        assignmentDate: parsed.data.assignmentDate,
        count: newSelections.length,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  return { success: "Assignments created." };
}

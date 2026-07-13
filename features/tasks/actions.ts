"use server";

import { revalidatePath } from "next/cache";
import {
  submitTaskSchema,
  updateSubtaskSchema,
} from "@/features/tasks/schemas";
import {
  buildEvidenceStoragePath,
  isAllowedEvidenceContentType,
  TASK_EVIDENCE_BUCKET,
  validateEvidenceFile,
} from "@/lib/storage/evidence";
import { createClient } from "@/lib/supabase/server";

export type TaskActionState = {
  error?: string;
  success?: string;
};

type TaskSubmitContext = {
  assignedToMemberId: string;
  evidenceTypeSnapshot: "photo" | "note" | null;
  familyId: string;
  requiresEvidenceSnapshot: boolean;
  status: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getEvidenceFile(formData: FormData) {
  const value = formData.get("evidenceFile");
  return value instanceof File && value.size > 0 ? value : null;
}

function isCompletedRow(row: { completed: unknown }) {
  return row.completed === true;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function getCurrentMemberIds(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_user_member_ids", {
    p_family_id: familyId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data)
    ? data.filter((id): id is string => typeof id === "string")
    : [];
}

async function requireSubmitContext(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_instances")
    .select(
      "family_id,assigned_to_member_id,status,requires_evidence_snapshot,evidence_type_snapshot",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.assigned_to_member_id) {
    throw new Error("Task is not available.");
  }

  const task = {
    assignedToMemberId: data.assigned_to_member_id as string,
    evidenceTypeSnapshot: data.evidence_type_snapshot as
      "photo" | "note" | null,
    familyId: data.family_id as string,
    requiresEvidenceSnapshot: Boolean(data.requires_evidence_snapshot),
    status: data.status as string,
  } satisfies TaskSubmitContext;
  const memberIds = await getCurrentMemberIds(task.familyId);

  if (!memberIds.includes(task.assignedToMemberId)) {
    throw new Error("Only the assigned family member can update this task.");
  }

  if (!["assigned", "in_progress", "rejected"].includes(task.status)) {
    throw new Error("This task is not open for submission.");
  }

  return task;
}

export async function updateSubtaskCompletion(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = updateSubtaskSchema.safeParse({
    completed: getString(formData, "completed"),
    subtaskId: getString(formData, "subtaskId"),
    taskId: getString(formData, "taskId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const task = await requireSubmitContext(parsed.data.taskId);
    const completed = parsed.data.completed === "true";
    const { error } = await supabase
      .from("task_instance_subtasks")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("family_id", task.familyId)
      .eq("task_instance_id", parsed.data.taskId)
      .eq("id", parsed.data.subtaskId);

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/my-today");
  return { success: "Checklist updated." };
}

export async function updateSubtaskCompletionForm(formData: FormData) {
  await updateSubtaskCompletion({}, formData);
}

export async function submitTask(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = submitTaskSchema.safeParse({
    note: getString(formData, "note"),
    taskId: getString(formData, "taskId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const task = await requireSubmitContext(parsed.data.taskId);
    const { data: subtaskRows, error: subtaskError } = await supabase
      .from("task_instance_subtasks")
      .select("completed")
      .eq("family_id", task.familyId)
      .eq("task_instance_id", parsed.data.taskId);

    if (subtaskError) {
      return { error: subtaskError.message };
    }

    if ((subtaskRows ?? []).some((row) => !isCompletedRow(row))) {
      return { error: "Finish the checklist before submitting." };
    }

    const evidenceFile = getEvidenceFile(formData);
    const { data: existingEvidence, error: evidenceLookupError } =
      await supabase
        .from("task_evidence_files")
        .select("id")
        .eq("family_id", task.familyId)
        .eq("task_instance_id", parsed.data.taskId)
        .limit(1);

    if (evidenceLookupError) {
      return { error: evidenceLookupError.message };
    }

    const hasExistingEvidence = (existingEvidence ?? []).length > 0;

    if (
      task.requiresEvidenceSnapshot &&
      task.evidenceTypeSnapshot === "note" &&
      parsed.data.note.length === 0
    ) {
      return { error: "Add a note before submitting this task." };
    }

    if (
      task.requiresEvidenceSnapshot &&
      task.evidenceTypeSnapshot !== "note" &&
      !evidenceFile &&
      !hasExistingEvidence
    ) {
      return { error: "Add an evidence photo before submitting this task." };
    }

    let uploadedEvidence: {
      contentType: string;
      id: string;
      path: string;
      size: number;
    } | null = null;

    if (evidenceFile) {
      const validationError = validateEvidenceFile(evidenceFile);

      if (validationError || !isAllowedEvidenceContentType(evidenceFile.type)) {
        return {
          error:
            validationError ??
            "Evidence must be a JPEG, PNG, WebP, or GIF image.",
        };
      }

      const evidenceId = crypto.randomUUID();
      const path = buildEvidenceStoragePath({
        evidenceId,
        familyId: task.familyId,
        memberId: task.assignedToMemberId,
        taskId: parsed.data.taskId,
        type: evidenceFile.type,
      });
      const { error: uploadError } = await supabase.storage
        .from(TASK_EVIDENCE_BUCKET)
        .upload(path, evidenceFile, {
          cacheControl: "3600",
          contentType: evidenceFile.type,
          upsert: false,
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      uploadedEvidence = {
        contentType: evidenceFile.type,
        id: evidenceId,
        path,
        size: evidenceFile.size,
      };
    }

    const { data: submissionRow, error: submissionError } = await supabase
      .from("task_submissions")
      .insert({
        family_id: task.familyId,
        note: parsed.data.note || null,
        submitted_by_member_id: task.assignedToMemberId,
        task_instance_id: parsed.data.taskId,
      })
      .select("id")
      .single();

    if (submissionError) {
      return { error: submissionError.message };
    }

    if (uploadedEvidence) {
      const { error: metadataError } = await supabase
        .from("task_evidence_files")
        .insert({
          content_type: uploadedEvidence.contentType,
          family_id: task.familyId,
          size_bytes: uploadedEvidence.size,
          storage_bucket: TASK_EVIDENCE_BUCKET,
          storage_path: uploadedEvidence.path,
          submission_id: submissionRow.id,
          task_instance_id: parsed.data.taskId,
          uploaded_by_member_id: task.assignedToMemberId,
        });

      if (metadataError) {
        return { error: metadataError.message };
      }
    }

    const { error: submitError } = await supabase.rpc("submit_task_instance", {
      p_submitted_by_member_id: task.assignedToMemberId,
      p_task_instance_id: parsed.data.taskId,
    });

    if (submitError) {
      return { error: submitError.message };
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/my-today");
  revalidatePath("/dashboard");
  return { success: "Task submitted for review." };
}

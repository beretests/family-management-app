"use server";

import { revalidatePath } from "next/cache";
import {
  calculateReviewPoints,
  pointsReviewNote,
} from "@/features/points/ledger";
import {
  approveTaskSchema,
  rejectTaskSchema,
} from "@/features/reviews/schemas";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ReviewTaskRow = {
  assigned_to_member_id: string | null;
  family_id: string;
  points_possible: number;
  rejection_count: number;
  status: string;
  title_snapshot: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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

async function requireSubmittedTask({
  familyId,
  supabase,
  taskId,
}: {
  familyId: string;
  supabase: AppSupabaseClient;
  taskId: string;
}) {
  const { data, error } = await supabase
    .from("task_instances")
    .select(
      "family_id,assigned_to_member_id,status,points_possible,rejection_count,title_snapshot",
    )
    .eq("family_id", familyId)
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const task = data as ReviewTaskRow | null;

  if (!task?.assigned_to_member_id) {
    throw new Error("Task is not available for review.");
  }

  if (task.status !== "submitted") {
    throw new Error("This task has already been reviewed or is not submitted.");
  }

  return task;
}

async function requireSubmission({
  familyId,
  submissionId,
  supabase,
  taskId,
}: {
  familyId: string;
  submissionId: string;
  supabase: AppSupabaseClient;
  taskId: string;
}) {
  const { data, error } = await supabase
    .from("task_submissions")
    .select("id")
    .eq("family_id", familyId)
    .eq("task_instance_id", taskId)
    .eq("id", submissionId)
    .eq("status", "submitted")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Submission is not available for review.");
  }
}

export async function approveTask(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsed = approveTaskSchema.safeParse({
    familyId: getString(formData, "familyId"),
    pointsAwarded: getString(formData, "pointsAwarded"),
    submissionId: getString(formData, "submissionId"),
    taskId: getString(formData, "taskId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const task = await requireSubmittedTask({
      familyId: parent.familyId,
      supabase,
      taskId: parsed.data.taskId,
    });
    await requireSubmission({
      familyId: parent.familyId,
      submissionId: parsed.data.submissionId,
      supabase,
      taskId: parsed.data.taskId,
    });

    if (parsed.data.pointsAwarded > task.points_possible) {
      return { error: "Awarded points cannot exceed possible points." };
    }

    const { error: reviewError } = await supabase.from("task_reviews").insert({
      decision: "approved",
      family_id: parent.familyId,
      feedback: null,
      points_awarded: parsed.data.pointsAwarded,
      reviewed_by_member_id: parent.memberId,
      submission_id: parsed.data.submissionId,
      task_instance_id: parsed.data.taskId,
    });

    if (reviewError) {
      return { error: reviewError.message };
    }

    const { error: ledgerError } = await supabase.from("points_ledger").insert({
      created_by_member_id: parent.memberId,
      family_id: parent.familyId,
      member_id: task.assigned_to_member_id,
      note: pointsReviewNote({
        pointsAwarded: parsed.data.pointsAwarded,
        taskTitle: task.title_snapshot,
      }),
      points_delta: parsed.data.pointsAwarded,
      source: "task_review",
      task_instance_id: parsed.data.taskId,
    });

    if (ledgerError) {
      return { error: ledgerError.message };
    }

    const { error: taskError } = await supabase
      .from("task_instances")
      .update({
        approved_at: new Date().toISOString(),
        points_awarded: parsed.data.pointsAwarded,
        status: "approved",
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.taskId)
      .eq("status", "submitted");

    if (taskError) {
      return { error: taskError.message };
    }

    await insertAuditEvent({
      action: "task_review.approved",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        pointsAwarded: parsed.data.pointsAwarded,
        submissionId: parsed.data.submissionId,
        taskId: parsed.data.taskId,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/my-today");
  return { success: "Task approved and points awarded." };
}

export async function rejectTask(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsed = rejectTaskSchema.safeParse({
    familyId: getString(formData, "familyId"),
    feedback: getString(formData, "feedback"),
    pointsAwarded: 0,
    submissionId: getString(formData, "submissionId"),
    taskId: getString(formData, "taskId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const task = await requireSubmittedTask({
      familyId: parent.familyId,
      supabase,
      taskId: parsed.data.taskId,
    });
    await requireSubmission({
      familyId: parent.familyId,
      submissionId: parsed.data.submissionId,
      supabase,
      taskId: parsed.data.taskId,
    });

    const { error: reviewError } = await supabase.from("task_reviews").insert({
      decision: "rejected",
      family_id: parent.familyId,
      feedback: parsed.data.feedback,
      points_awarded: 0,
      reviewed_by_member_id: parent.memberId,
      submission_id: parsed.data.submissionId,
      task_instance_id: parsed.data.taskId,
    });

    if (reviewError) {
      return { error: reviewError.message };
    }

    const { error: taskError } = await supabase
      .from("task_instances")
      .update({
        rejected_at: new Date().toISOString(),
        rejection_count: task.rejection_count + 1,
        rejection_reason: parsed.data.feedback,
        status: "rejected",
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.taskId)
      .eq("status", "submitted");

    if (taskError) {
      return { error: taskError.message };
    }

    await insertAuditEvent({
      action: "task_review.rejected",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        submissionId: parsed.data.submissionId,
        taskId: parsed.data.taskId,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/my-today");
  return { success: "Task sent back with feedback." };
}

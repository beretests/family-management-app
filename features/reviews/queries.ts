import { createClient } from "@/lib/supabase/server";
import { TASK_EVIDENCE_BUCKET } from "@/lib/storage/evidence";
import type {
  TaskEvidenceFile,
  TaskSubmission,
  TaskSubtask,
} from "@/features/tasks/types";
import type { ReviewQueueItem } from "@/features/reviews/types";

type ReviewTaskRow = {
  id: string;
  family_id: string;
  assigned_to_member_id: string | null;
  assigned_member: { display_name: string } | { display_name: string }[] | null;
  title_snapshot: string;
  points_possible: number;
  points_awarded: number | null;
  status: string;
  due_at: string | null;
  submitted_at: string | null;
  rejection_count: number;
  rejection_reason: string | null;
  difficulty_snapshot: number;
  estimated_minutes_snapshot: number;
  requires_evidence_snapshot: boolean;
  evidence_type_snapshot: "photo" | "note" | null;
  completion_check_text_snapshot: string | null;
};

type SubtaskRow = {
  id: string;
  family_id: string;
  task_instance_id: string;
  position: number;
  title: string;
  completed: boolean;
  completed_at: string | null;
};

type SubmissionRow = {
  id: string;
  family_id: string;
  task_instance_id: string;
  submitted_by_member_id: string;
  status: "submitted" | "superseded" | "withdrawn";
  note: string | null;
  submitted_at: string;
};

type EvidenceRow = {
  id: string;
  family_id: string;
  task_instance_id: string;
  submission_id: string | null;
  uploaded_by_member_id: string;
  storage_bucket: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  retention_delete_after: string | null;
  created_at: string;
};

const reviewTaskSelect =
  "id,family_id,assigned_to_member_id,assigned_member:family_members!task_instances_assigned_to_member_id_fkey(display_name),title_snapshot,points_possible,points_awarded,status,due_at,submitted_at,rejection_count,rejection_reason,difficulty_snapshot,estimated_minutes_snapshot,requires_evidence_snapshot,evidence_type_snapshot,completion_check_text_snapshot";

function getAssignedMemberName(
  value: { display_name: string } | { display_name: string }[] | null,
) {
  if (Array.isArray(value)) {
    return value[0]?.display_name ?? null;
  }

  return value?.display_name ?? null;
}

function mapSubtask(row: SubtaskRow): TaskSubtask {
  return {
    completed: row.completed,
    completedAt: row.completed_at,
    familyId: row.family_id,
    id: row.id,
    position: row.position,
    taskInstanceId: row.task_instance_id,
    title: row.title,
  };
}

function mapSubmission(row: SubmissionRow): TaskSubmission {
  return {
    familyId: row.family_id,
    id: row.id,
    note: row.note,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedByMemberId: row.submitted_by_member_id,
    taskInstanceId: row.task_instance_id,
  };
}

async function mapEvidenceFiles(rows: EvidenceRow[]) {
  const supabase = await createClient();

  return Promise.all(
    rows.map(async (row): Promise<TaskEvidenceFile> => {
      const { data } = await supabase.storage
        .from(TASK_EVIDENCE_BUCKET)
        .createSignedUrl(row.storage_path, 600);

      return {
        contentType: row.content_type,
        createdAt: row.created_at,
        familyId: row.family_id,
        id: row.id,
        retentionDeleteAfter: row.retention_delete_after,
        signedUrl: data?.signedUrl ?? null,
        sizeBytes: row.size_bytes,
        storageBucket: row.storage_bucket,
        storagePath: row.storage_path,
        submissionId: row.submission_id,
        taskInstanceId: row.task_instance_id,
        uploadedByMemberId: row.uploaded_by_member_id,
      };
    }),
  );
}

function groupByTaskId<T extends { taskInstanceId: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    grouped.set(item.taskInstanceId, [
      ...(grouped.get(item.taskInstanceId) ?? []),
      item,
    ]);
  }

  return grouped;
}

export async function getPendingReviewItems(familyId: string) {
  const supabase = await createClient();
  const { data: taskRows, error: taskError } = await supabase
    .from("task_instances")
    .select(reviewTaskSelect)
    .eq("family_id", familyId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (taskError) {
    throw new Error(taskError.message);
  }

  const tasks = (taskRows ?? []) as unknown as ReviewTaskRow[];
  const taskIds = tasks.map((task) => task.id);

  if (taskIds.length === 0) {
    return [];
  }

  const [
    { data: subtaskRows, error: subtaskError },
    { data: submissionRows, error: submissionError },
    { data: evidenceRows, error: evidenceError },
  ] = await Promise.all([
    supabase
      .from("task_instance_subtasks")
      .select(
        "id,family_id,task_instance_id,position,title,completed,completed_at",
      )
      .in("task_instance_id", taskIds)
      .order("position", { ascending: true }),
    supabase
      .from("task_submissions")
      .select(
        "id,family_id,task_instance_id,submitted_by_member_id,status,note,submitted_at",
      )
      .in("task_instance_id", taskIds)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false }),
    supabase
      .from("task_evidence_files")
      .select(
        "id,family_id,task_instance_id,submission_id,uploaded_by_member_id,storage_bucket,storage_path,content_type,size_bytes,retention_delete_after,created_at",
      )
      .in("task_instance_id", taskIds)
      .order("created_at", { ascending: false }),
  ]);

  if (subtaskError) {
    throw new Error(subtaskError.message);
  }

  if (submissionError) {
    throw new Error(submissionError.message);
  }

  if (evidenceError) {
    throw new Error(evidenceError.message);
  }

  const subtasksByTask = groupByTaskId(
    ((subtaskRows ?? []) as SubtaskRow[]).map(mapSubtask),
  );
  const submissionsByTask = groupByTaskId(
    ((submissionRows ?? []) as SubmissionRow[]).map(mapSubmission),
  );
  const evidenceByTask = groupByTaskId(
    await mapEvidenceFiles((evidenceRows ?? []) as EvidenceRow[]),
  );

  return tasks.map<ReviewQueueItem>((task) => ({
    assignedToMemberId: task.assigned_to_member_id,
    assignedToName: getAssignedMemberName(task.assigned_member),
    completionCheckTextSnapshot: task.completion_check_text_snapshot,
    difficultySnapshot: task.difficulty_snapshot,
    dueAt: task.due_at,
    estimatedMinutesSnapshot: task.estimated_minutes_snapshot,
    evidenceFiles: evidenceByTask.get(task.id) ?? [],
    evidenceTypeSnapshot: task.evidence_type_snapshot,
    familyId: task.family_id,
    id: task.id,
    pointsAwarded: task.points_awarded,
    pointsPossible: task.points_possible,
    rejectionCount: task.rejection_count,
    rejectionReason: task.rejection_reason,
    requiresEvidenceSnapshot: task.requires_evidence_snapshot,
    status: task.status,
    submissions: submissionsByTask.get(task.id) ?? [],
    subtasks: subtasksByTask.get(task.id) ?? [],
    submittedAt: task.submitted_at,
    titleSnapshot: task.title_snapshot,
  }));
}

export async function getPendingReviewCount(familyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("task_instances")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("status", "submitted");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

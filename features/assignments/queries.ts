import { createClient } from "@/lib/supabase/server";
import type {
  TaskInstance,
  TaskStatus,
  TaskSubtaskSnapshot,
} from "@/features/assignments/types";

type TaskInstanceRow = {
  id: string;
  family_id: string;
  template_id: string | null;
  assigned_to_member_id: string | null;
  created_by_member_id: string | null;
  title_snapshot: string;
  subtasks_snapshot: unknown;
  points_possible: number;
  points_awarded: number | null;
  status: TaskStatus;
  due_at: string | null;
  available_from: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_count: number;
  rejection_reason: string | null;
  assignment_reason: string | null;
  difficulty_snapshot: number;
  estimated_minutes_snapshot: number;
  requires_evidence_snapshot: boolean;
  evidence_type_snapshot: "photo" | "note" | null;
  completion_check_text_snapshot: string | null;
  is_undesirable: boolean;
  created_at: string;
  updated_at: string;
};

function mapSubtasksSnapshot(value: unknown): TaskSubtaskSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "position" in item &&
        "title" in item &&
        typeof item.position === "number" &&
        typeof item.title === "string"
      ) {
        return {
          position: item.position,
          title: item.title,
        };
      }

      return null;
    })
    .filter((item): item is TaskSubtaskSnapshot => item !== null);
}

function mapTaskInstance(row: TaskInstanceRow): TaskInstance {
  return {
    approvedAt: row.approved_at,
    assignmentReason: row.assignment_reason,
    assignedToMemberId: row.assigned_to_member_id,
    availableFrom: row.available_from,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    createdByMemberId: row.created_by_member_id,
    difficultySnapshot: row.difficulty_snapshot,
    dueAt: row.due_at,
    evidenceTypeSnapshot: row.evidence_type_snapshot,
    estimatedMinutesSnapshot: row.estimated_minutes_snapshot,
    familyId: row.family_id,
    id: row.id,
    isUndesirable: row.is_undesirable,
    pointsAwarded: row.points_awarded,
    pointsPossible: row.points_possible,
    rejectedAt: row.rejected_at,
    rejectionCount: row.rejection_count,
    rejectionReason: row.rejection_reason,
    requiresEvidenceSnapshot: row.requires_evidence_snapshot,
    status: row.status,
    submittedAt: row.submitted_at,
    subtasksSnapshot: mapSubtasksSnapshot(row.subtasks_snapshot),
    templateId: row.template_id,
    titleSnapshot: row.title_snapshot,
    updatedAt: row.updated_at,
    completionCheckTextSnapshot: row.completion_check_text_snapshot,
  };
}

const taskInstanceSelect =
  "id,family_id,template_id,assigned_to_member_id,created_by_member_id,title_snapshot,subtasks_snapshot,points_possible,points_awarded,status,due_at,available_from,completed_at,submitted_at,approved_at,rejected_at,rejection_count,rejection_reason,assignment_reason,difficulty_snapshot,estimated_minutes_snapshot,requires_evidence_snapshot,evidence_type_snapshot,completion_check_text_snapshot,is_undesirable,created_at,updated_at";

export async function getTaskInstances({
  endsAt,
  familyId,
  startsAt,
}: {
  endsAt: Date;
  familyId: string;
  startsAt: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_instances")
    .select(taskInstanceSelect)
    .eq("family_id", familyId)
    .gte("created_at", startsAt.toISOString())
    .lte("created_at", endsAt.toISOString())
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TaskInstanceRow[]).map(mapTaskInstance);
}

export async function getTaskInstancesDueBetween({
  endsAt,
  familyId,
  startsAt,
}: {
  endsAt: Date;
  familyId: string;
  startsAt: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_instances")
    .select(taskInstanceSelect)
    .eq("family_id", familyId)
    .gte("due_at", startsAt.toISOString())
    .lte("due_at", endsAt.toISOString())
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TaskInstanceRow[]).map(mapTaskInstance);
}

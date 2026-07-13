import type {
  TaskEvidenceFile,
  TaskSubmission,
  TaskSubtask,
} from "@/features/tasks/types";

export type ReviewDecision = "approved" | "rejected";

export type ReviewQueueItem = {
  id: string;
  familyId: string;
  assignedToMemberId: string | null;
  assignedToName: string | null;
  titleSnapshot: string;
  pointsPossible: number;
  pointsAwarded: number | null;
  status: string;
  dueAt: string | null;
  submittedAt: string | null;
  rejectionCount: number;
  rejectionReason: string | null;
  difficultySnapshot: number;
  estimatedMinutesSnapshot: number;
  requiresEvidenceSnapshot: boolean;
  evidenceTypeSnapshot: "photo" | "note" | null;
  completionCheckTextSnapshot: string | null;
  subtasks: TaskSubtask[];
  submissions: TaskSubmission[];
  evidenceFiles: TaskEvidenceFile[];
};

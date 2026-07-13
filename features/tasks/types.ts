import type {
  TaskStatus,
  TaskSubtaskSnapshot,
} from "@/features/assignments/types";

export type TaskSubmissionStatus = "submitted" | "approved" | "rejected";

export type TaskSubtask = {
  id: string;
  familyId: string;
  taskInstanceId: string;
  position: number;
  title: string;
  completed: boolean;
  completedAt: string | null;
};

export type TaskSubmission = {
  id: string;
  familyId: string;
  taskInstanceId: string;
  submittedByMemberId: string;
  status: TaskSubmissionStatus;
  note: string | null;
  submittedAt: string;
};

export type TaskEvidenceFile = {
  id: string;
  familyId: string;
  taskInstanceId: string;
  submissionId: string | null;
  uploadedByMemberId: string;
  storageBucket: string;
  storagePath: string;
  contentType: string | null;
  sizeBytes: number | null;
  retentionDeleteAfter: string | null;
  createdAt: string;
  signedUrl: string | null;
};

export type TodayTask = {
  id: string;
  familyId: string;
  templateId: string | null;
  assignedToMemberId: string | null;
  assignedToName: string | null;
  titleSnapshot: string;
  subtasksSnapshot: TaskSubtaskSnapshot[];
  pointsPossible: number;
  status: TaskStatus;
  dueAt: string | null;
  availableFrom: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  rejectedAt: string | null;
  rejectionCount: number;
  rejectionReason: string | null;
  assignmentReason: string | null;
  difficultySnapshot: number;
  estimatedMinutesSnapshot: number;
  requiresEvidenceSnapshot: boolean;
  evidenceTypeSnapshot: "photo" | "note" | null;
  completionCheckTextSnapshot: string | null;
  subtasks: TaskSubtask[];
  submissions: TaskSubmission[];
  evidenceFiles: TaskEvidenceFile[];
};

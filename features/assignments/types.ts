import type { ChoreTemplate } from "@/features/chores/types";

export type TaskStatus =
  | "draft"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "overdue"
  | "cancelled";

export type TaskSubtaskSnapshot = {
  position: number;
  title: string;
};

export type TaskInstance = {
  id: string;
  familyId: string;
  templateId: string | null;
  assignedToMemberId: string | null;
  createdByMemberId: string | null;
  titleSnapshot: string;
  subtasksSnapshot: TaskSubtaskSnapshot[];
  pointsPossible: number;
  pointsAwarded: number | null;
  status: TaskStatus;
  dueAt: string | null;
  availableFrom: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionCount: number;
  rejectionReason: string | null;
  assignmentReason: string | null;
  difficultySnapshot: number;
  estimatedMinutesSnapshot: number;
  isUndesirable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentCandidateScore = {
  memberId: string;
  memberName: string;
  eligible: boolean;
  score: number;
  reasons: string[];
  blockers: string[];
  warnings: string[];
};

export type AssignmentPreview = {
  template: ChoreTemplate;
  recommendedMemberId: string | null;
  recommendedMemberName: string | null;
  score: number | null;
  assignmentReason: string;
  warnings: string[];
  candidates: AssignmentCandidateScore[];
};

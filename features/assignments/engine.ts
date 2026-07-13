import type { ChoreTemplate } from "@/features/chores/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import type {
  AssignmentCandidateScore,
  AssignmentPreview,
  TaskInstance,
  TaskSubtaskSnapshot,
} from "@/features/assignments/types";

const activeTaskStatuses = new Set([
  "draft",
  "assigned",
  "in_progress",
  "submitted",
]);

export type GenerateAssignmentPreviewInput = {
  templates: ChoreTemplate[];
  members: FamilyMemberWithDetails[];
  scheduleEvents: ScheduleEvent[];
  recentTasks: TaskInstance[];
  assignmentWindowStart: Date;
  assignmentWindowEnd: Date;
};

export function buildSubtaskSnapshot(
  template: ChoreTemplate,
): TaskSubtaskSnapshot[] {
  return template.subtasks
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((subtask) => ({
      position: subtask.position,
      title: subtask.title,
    }));
}

export function generateAssignmentPreview({
  assignmentWindowEnd,
  assignmentWindowStart,
  members,
  recentTasks,
  scheduleEvents,
  templates,
}: GenerateAssignmentPreviewInput): AssignmentPreview[] {
  const assignableMembers = members.filter(
    (member) => member.role === "child" && member.lifecycleStatus === "active",
  );
  const workloadByMember = calculateWorkloadByMember(recentTasks);
  const assignedCounts = new Map<string, number>();

  return templates
    .filter((template) => template.active)
    .map((template) => {
      const candidates = assignableMembers.map((member) =>
        scoreCandidate({
          assignmentWindowEnd,
          assignmentWindowStart,
          member,
          recentWorkload: workloadByMember.get(member.id) ?? {
            minutes: 0,
            points: 0,
            undesirableCount: 0,
          },
          scheduleEvents,
          template,
        }),
      );
      const eligibleCandidates = candidates
        .filter((candidate) => candidate.eligible)
        .map((candidate) => ({
          ...candidate,
          score:
            candidate.score + (assignedCounts.get(candidate.memberId) ?? 0) * 8,
        }))
        .sort(
          (left, right) =>
            left.score - right.score ||
            left.memberName.localeCompare(right.memberName),
        );
      const recommended = eligibleCandidates[0] ?? null;

      if (recommended) {
        assignedCounts.set(
          recommended.memberId,
          (assignedCounts.get(recommended.memberId) ?? 0) + 1,
        );
      }

      return {
        assignmentReason: recommended
          ? buildAssignmentReason(recommended)
          : buildNoCandidateReason(candidates),
        candidates,
        recommendedMemberId: recommended?.memberId ?? null,
        recommendedMemberName: recommended?.memberName ?? null,
        score: recommended?.score ?? null,
        template,
        warnings: recommended?.warnings ?? [],
      };
    });
}

export function buildAssignmentReason(candidate: AssignmentCandidateScore) {
  const primaryReasons = candidate.reasons.slice(0, 3);
  const caution = candidate.warnings[0];
  const base =
    primaryReasons.length > 0
      ? `${candidate.memberName}: ${primaryReasons.join(", ")}.`
      : `${candidate.memberName}: eligible for this chore.`;

  return caution ? `${base} Note: ${caution}.` : base;
}

function buildNoCandidateReason(candidates: AssignmentCandidateScore[]) {
  const blockers = candidates
    .flatMap((candidate) =>
      candidate.blockers.map(
        (blocker) => `${candidate.memberName}: ${blocker}`,
      ),
    )
    .slice(0, 3);

  if (blockers.length === 0) {
    return "No active child profiles are available for assignment.";
  }

  return `No eligible child found. ${blockers.join("; ")}.`;
}

function scoreCandidate({
  assignmentWindowEnd,
  assignmentWindowStart,
  member,
  recentWorkload,
  scheduleEvents,
  template,
}: {
  assignmentWindowEnd: Date;
  assignmentWindowStart: Date;
  member: FamilyMemberWithDetails;
  recentWorkload: { minutes: number; points: number; undesirableCount: number };
  scheduleEvents: ScheduleEvent[];
  template: ChoreTemplate;
}): AssignmentCandidateScore {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (member.ageYears === null) {
    warnings.push("age is unknown, so parent review is important");
    score += 10;
  } else {
    if (member.ageYears < template.minimumAge) {
      blockers.push(
        `age ${member.ageYears} is below the minimum age ${template.minimumAge}`,
      );
    }

    if (template.maximumAge !== null && member.ageYears > template.maximumAge) {
      blockers.push(
        `age ${member.ageYears} is above the maximum age ${template.maximumAge}`,
      );
    }

    if (blockers.length === 0) {
      reasons.push(`age ${member.ageYears} fits`);
    }
  }

  const currentStatus = member.currentStatus?.status ?? "normal";
  if (currentStatus === "sick" || currentStatus === "rest_day") {
    blockers.push(`${currentStatus.replace("_", " ")} status is active`);
  } else if (currentStatus === "under_the_weather") {
    if (template.difficulty > 2) {
      blockers.push("under-the-weather status does not fit this difficulty");
    } else {
      warnings.push("under-the-weather status is active");
      score += 18;
    }
  } else {
    reasons.push("normal status");
  }

  if (template.difficulty >= 4 && member.abilityLevel <= 2) {
    blockers.push(
      `ability ${member.abilityLevel}/5 is too low for difficulty ${template.difficulty}/5`,
    );
  } else if (template.difficulty > member.abilityLevel + 1) {
    warnings.push("difficulty is above current ability");
    score += 14;
  } else {
    reasons.push(
      `ability ${member.abilityLevel}/5 fits difficulty ${template.difficulty}/5`,
    );
  }

  const conflictCount = countScheduleConflicts({
    assignmentWindowEnd,
    assignmentWindowStart,
    memberId: member.id,
    scheduleEvents,
  });
  if (conflictCount > 0) {
    warnings.push(
      `${conflictCount} schedule conflict${conflictCount === 1 ? "" : "s"}`,
    );
    score += conflictCount * 12;
  } else {
    reasons.push("no schedule conflict");
  }

  const preferenceHit = member.preferences?.notes
    ? preferenceMentionsTemplate(member.preferences.notes, template)
    : false;
  if (preferenceHit) {
    warnings.push("preference notes mention this chore or area");
    score += 16;
  }

  if (recentWorkload.minutes > 0) {
    score += Math.min(24, recentWorkload.minutes / 10);
    score += Math.min(12, recentWorkload.points / 20);
  } else {
    reasons.push("lightest recent workload");
  }

  if (template.undesirableScore >= 3 && recentWorkload.undesirableCount > 0) {
    warnings.push("recent undesirable chore history");
    score += recentWorkload.undesirableCount * template.undesirableScore * 3;
  }

  score += template.estimatedMinutes / 20;
  score += template.difficulty * 2;
  score += template.undesirableScore;

  return {
    blockers,
    eligible: blockers.length === 0,
    memberId: member.id,
    memberName: member.displayName,
    reasons,
    score,
    warnings,
  };
}

function calculateWorkloadByMember(tasks: TaskInstance[]) {
  const workload = new Map<
    string,
    { minutes: number; points: number; undesirableCount: number }
  >();

  for (const task of tasks) {
    if (!task.assignedToMemberId || !activeTaskStatuses.has(task.status)) {
      continue;
    }

    const current = workload.get(task.assignedToMemberId) ?? {
      minutes: 0,
      points: 0,
      undesirableCount: 0,
    };

    current.minutes += task.estimatedMinutesSnapshot;
    current.points += task.pointsPossible;
    current.undesirableCount += task.isUndesirable ? 1 : 0;
    workload.set(task.assignedToMemberId, current);
  }

  return workload;
}

function countScheduleConflicts({
  assignmentWindowEnd,
  assignmentWindowStart,
  memberId,
  scheduleEvents,
}: {
  assignmentWindowEnd: Date;
  assignmentWindowStart: Date;
  memberId: string;
  scheduleEvents: ScheduleEvent[];
}) {
  return scheduleEvents.filter((event) => {
    if (event.memberId !== memberId) {
      return false;
    }

    const startsAt = new Date(event.startsAt);
    const endsAt = new Date(event.endsAt);
    return startsAt < assignmentWindowEnd && endsAt > assignmentWindowStart;
  }).length;
}

function preferenceMentionsTemplate(notes: string, template: ChoreTemplate) {
  const normalized = notes.toLowerCase();
  const fields = [
    template.title,
    template.category,
    template.location,
    template.description,
  ].filter((value): value is string => Boolean(value));

  return fields.some((field) =>
    field
      .toLowerCase()
      .split(/\s+/)
      .filter((part) => part.length >= 4)
      .some((part) => normalized.includes(part)),
  );
}

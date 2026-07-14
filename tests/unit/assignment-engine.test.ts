import { describe, expect, it } from "vitest";
import {
  buildSubtaskSnapshot,
  generateAssignmentPreview,
} from "@/features/assignments/engine";
import type { TaskInstance } from "@/features/assignments/types";
import type { ChoreTemplate } from "@/features/chores/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";

const familyId = "11111111-1111-4111-8111-111111111111";
const childAId = "22222222-2222-4222-8222-222222222222";
const childBId = "33333333-3333-4333-8333-333333333333";
const templateId = "44444444-4444-4444-8444-444444444444";
const windowStart = new Date("2026-07-13T15:00:00.000Z");
const windowEnd = new Date("2026-07-13T20:00:00.000Z");

function child(
  id: string,
  displayName: string,
  overrides: Partial<FamilyMemberWithDetails> = {},
): FamilyMemberWithDetails {
  return {
    abilityLevel: 3,
    ageYears: 11,
    birthdate: null,
    color: null,
    currentStatus: null,
    deactivatedAt: null,
    displayName,
    familyId,
    hasKidModePin: false,
    id,
    lifecycleStatus: "active",
    preferences: null,
    profileId: null,
    role: "child",
    ...overrides,
  };
}

function template(overrides: Partial<ChoreTemplate> = {}): ChoreTemplate {
  return {
    active: true,
    basePoints: 20,
    category: "bathroom",
    completionCheckText: null,
    createdAt: "2026-07-13T00:00:00.000Z",
    createdByMemberId: null,
    dependencyTemplateIds: [],
    description: "Clean the bathroom sink and mirror",
    difficulty: 2,
    emoji: null,
    estimatedMinutes: 20,
    evidenceType: null,
    familyId,
    frequency: "weekly",
    id: templateId,
    location: "Bathroom",
    maximumAge: null,
    minimumAge: 8,
    requiresEvidence: false,
    requiresParentReview: true,
    safetyNotes: null,
    subtasks: [
      {
        familyId,
        id: "55555555-5555-4555-8555-555555555555",
        position: 2,
        templateId,
        title: "Wipe mirror",
      },
      {
        familyId,
        id: "66666666-6666-4666-8666-666666666666",
        position: 1,
        templateId,
        title: "Clear counter",
      },
    ],
    title: "Clean Bathroom",
    undesirableScore: 4,
    updatedAt: "2026-07-13T00:00:00.000Z",
    ...overrides,
  };
}

function task(overrides: Partial<TaskInstance>): TaskInstance {
  return {
    approvedAt: null,
    assignedToMemberId: childAId,
    assignmentReason: null,
    availableFrom: null,
    completedAt: null,
    createdAt: "2026-07-12T00:00:00.000Z",
    createdByMemberId: null,
    difficultySnapshot: 2,
    dueAt: "2026-07-12T18:00:00.000Z",
    evidenceTypeSnapshot: null,
    estimatedMinutesSnapshot: 20,
    familyId,
    id: "77777777-7777-4777-8777-777777777777",
    isUndesirable: false,
    pointsAwarded: null,
    pointsPossible: 20,
    rejectedAt: null,
    rejectionCount: 0,
    rejectionReason: null,
    requiresEvidenceSnapshot: false,
    status: "assigned",
    submittedAt: null,
    subtasksSnapshot: [],
    templateId,
    titleSnapshot: "Clean Bathroom",
    updatedAt: "2026-07-12T00:00:00.000Z",
    completionCheckTextSnapshot: null,
    ...overrides,
  };
}

function event(overrides: Partial<ScheduleEvent>): ScheduleEvent {
  return {
    allDay: false,
    color: null,
    createdAt: "2026-07-13T00:00:00.000Z",
    createdByMemberId: null,
    description: null,
    endsAt: "2026-07-13T18:00:00.000Z",
    eventType: "extracurricular",
    familyId,
    id: "88888888-8888-4888-8888-888888888888",
    location: null,
    memberId: childAId,
    startsAt: "2026-07-13T16:00:00.000Z",
    taskInstanceId: null,
    title: "Soccer",
    updatedAt: "2026-07-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("generateAssignmentPreview", () => {
  it("excludes inactive, sick, rest-day, and age-ineligible children", () => {
    const [preview] = generateAssignmentPreview({
      assignmentWindowEnd: windowEnd,
      assignmentWindowStart: windowStart,
      members: [
        child(childAId, "Ari", { ageYears: 7 }),
        child(childBId, "Bea", {
          currentStatus: {
            endsAt: null,
            familyId,
            id: "99999999-9999-4999-8999-999999999999",
            memberId: childBId,
            note: null,
            startsAt: "2026-07-13T00:00:00.000Z",
            status: "sick",
          },
        }),
      ],
      recentTasks: [],
      scheduleEvents: [],
      templates: [template()],
    });

    expect(preview.recommendedMemberId).toBeNull();
    expect(preview.assignmentReason).toContain("No eligible child");
  });

  it("penalizes schedule conflicts and recommends the available child", () => {
    const [preview] = generateAssignmentPreview({
      assignmentWindowEnd: windowEnd,
      assignmentWindowStart: windowStart,
      members: [child(childAId, "Ari"), child(childBId, "Bea")],
      recentTasks: [],
      scheduleEvents: [event({ memberId: childAId })],
      templates: [template()],
    });

    expect(preview.recommendedMemberId).toBe(childBId);
    expect(
      preview.candidates.find((candidate) => candidate.memberId === childAId)
        ?.warnings,
    ).toContain("1 schedule conflict");
  });

  it("prefers the child with lighter recent workload and undesirable rotation", () => {
    const [preview] = generateAssignmentPreview({
      assignmentWindowEnd: windowEnd,
      assignmentWindowStart: windowStart,
      members: [child(childAId, "Ari"), child(childBId, "Bea")],
      recentTasks: [
        task({
          assignedToMemberId: childAId,
          estimatedMinutesSnapshot: 80,
          isUndesirable: true,
          pointsPossible: 80,
        }),
      ],
      scheduleEvents: [],
      templates: [template()],
    });

    expect(preview.recommendedMemberId).toBe(childBId);
  });

  it("applies preference notes as a soft penalty", () => {
    const [preview] = generateAssignmentPreview({
      assignmentWindowEnd: windowEnd,
      assignmentWindowStart: windowStart,
      members: [
        child(childAId, "Ari", {
          preferences: {
            familyId,
            id: "99999999-9999-4999-8999-999999999999",
            memberId: childAId,
            notes: "Hates cleaning bathrooms",
          },
        }),
        child(childBId, "Bea"),
      ],
      recentTasks: [],
      scheduleEvents: [],
      templates: [template()],
    });

    expect(preview.recommendedMemberId).toBe(childBId);
  });

  it("snapshots subtasks in template position order", () => {
    expect(buildSubtaskSnapshot(template())).toEqual([
      { position: 1, title: "Clear counter" },
      { position: 2, title: "Wipe mirror" },
    ]);
  });
});

"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  createAssignments,
  type AssignmentActionState,
} from "@/features/assignments/actions";
import type { AssignmentPreview } from "@/features/assignments/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";

const initialState: AssignmentActionState = {};

export function AssignmentPreviewForm({
  assignmentDate,
  dueTime,
  familyId,
  members,
  previews,
}: {
  assignmentDate: string;
  dueTime: string;
  familyId: string;
  members: FamilyMemberWithDetails[];
  previews: AssignmentPreview[];
}) {
  const [state, formAction] = useActionState(createAssignments, initialState);
  const childMembers = members.filter(
    (member) => member.role === "child" && member.lifecycleStatus === "active",
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input name="assignmentDate" type="hidden" value={assignmentDate} />
      <input name="dueTime" type="hidden" value={dueTime} />
      <input name="familyId" type="hidden" value={familyId} />
      <ActionMessage error={state.error} success={state.success} />

      {previews.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          No active chore templates are ready. Generate or activate templates
          from the chores page first.
        </p>
      ) : null}

      {previews.map((preview) => (
        <article
          className="rounded-md border border-[var(--line)] p-4"
          key={preview.template.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {preview.template.emoji ? `${preview.template.emoji} ` : ""}
                {preview.template.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {preview.template.estimatedMinutes} min · difficulty{" "}
                {preview.template.difficulty}/5 · {preview.template.basePoints}{" "}
                points · age {preview.template.minimumAge}
                {preview.template.maximumAge
                  ? `-${preview.template.maximumAge}`
                  : "+"}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                {preview.assignmentReason}
              </p>
              <input
                name={`reason:${preview.template.id}`}
                type="hidden"
                value={preview.assignmentReason}
              />
              {preview.warnings.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm text-[var(--warning)]">
                  {preview.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <label className="grid min-w-56 gap-2 text-sm font-semibold text-[var(--foreground)]">
              Assign to
              <select
                className="min-h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"
                defaultValue={preview.recommendedMemberId ?? ""}
                name={`assignee:${preview.template.id}`}
              >
                <option value="">Skip</option>
                {childMembers.map((member) => {
                  const candidate = preview.candidates.find(
                    (item) => item.memberId === member.id,
                  );

                  return (
                    <option
                      disabled={!candidate?.eligible}
                      key={member.id}
                      value={member.id}
                    >
                      {member.displayName}
                      {!candidate?.eligible ? " (not eligible)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {preview.candidates.length > 0 ? (
            <details className="mt-4 rounded-md border border-[var(--line)] p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
                Candidate details
              </summary>
              <div className="mt-3 grid gap-2">
                {preview.candidates.map((candidate) => (
                  <div
                    className="rounded-md border border-[var(--line)] p-3 text-sm"
                    key={candidate.memberId}
                  >
                    <p className="font-semibold text-[var(--foreground)]">
                      {candidate.memberName} ·{" "}
                      {candidate.eligible ? "eligible" : "not eligible"} · score{" "}
                      {Math.round(candidate.score)}
                    </p>
                    <p className="mt-1 text-[var(--muted)]">
                      {candidate.eligible
                        ? candidate.reasons.join(", ") || "Eligible"
                        : candidate.blockers.join(", ")}
                    </p>
                    {candidate.warnings.length > 0 ? (
                      <p className="mt-1 text-[var(--warning)]">
                        {candidate.warnings.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </article>
      ))}

      {previews.length > 0 ? (
        <div>
          <SubmitButton>Create assignments</SubmitButton>
        </div>
      ) : null}
    </form>
  );
}

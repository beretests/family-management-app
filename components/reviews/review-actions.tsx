"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { calculateReviewPoints } from "@/features/points/ledger";
import {
  approveTask,
  rejectTask,
  type ReviewActionState,
} from "@/features/reviews/actions";
import type { ReviewQueueItem } from "@/features/reviews/types";

const initialState: ReviewActionState = {};

export function ReviewActions({
  familyId,
  item,
}: {
  familyId: string;
  item: ReviewQueueItem;
}) {
  const [approveState, approveAction] = useActionState(
    approveTask,
    initialState,
  );
  const [rejectState, rejectAction] = useActionState(rejectTask, initialState);
  const submission = item.submissions[0];
  const recommended = calculateReviewPoints({
    pointsPossible: item.pointsPossible,
    rejectionCount: item.rejectionCount,
  });

  if (!submission) {
    return (
      <p className="mt-4 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
        This task is missing a submitted review item.
      </p>
    );
  }

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <form
        action={approveAction}
        className="rounded-md border border-[var(--line)] p-4"
      >
        <input name="familyId" type="hidden" value={familyId} />
        <input name="taskId" type="hidden" value={item.id} />
        <input name="submissionId" type="hidden" value={submission.id} />
        <h3 className="font-semibold text-[var(--foreground)]">Approve</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Award points and mark this chore complete.
        </p>
        <label className="mt-3 grid gap-2 text-sm font-semibold text-[var(--foreground)]">
          Points
          <input
            className="min-h-10 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"
            max={item.pointsPossible}
            min={0}
            name="pointsAwarded"
            type="number"
            defaultValue={recommended}
          />
        </label>
        <div className="mt-3">
          <ActionMessage
            error={approveState.error}
            success={approveState.success}
          />
        </div>
        <div className="mt-3">
          <SubmitButton>Approve task</SubmitButton>
        </div>
      </form>

      <form
        action={rejectAction}
        className="rounded-md border border-[var(--line)] p-4"
      >
        <input name="familyId" type="hidden" value={familyId} />
        <input name="taskId" type="hidden" value={item.id} />
        <input name="submissionId" type="hidden" value={submission.id} />
        <h3 className="font-semibold text-[var(--foreground)]">Send back</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Keep feedback clear and kind so the chore can be fixed.
        </p>
        <label className="mt-3 grid gap-2 text-sm font-semibold text-[var(--foreground)]">
          Feedback
          <textarea
            className="min-h-24 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
            maxLength={500}
            name="feedback"
            placeholder="Example: Nice start. Please wipe the mirror once more and resubmit."
          />
        </label>
        <div className="mt-3">
          <ActionMessage
            error={rejectState.error}
            success={rejectState.success}
          />
        </div>
        <div className="mt-3">
          <SubmitButton tone="secondary">Send back</SubmitButton>
        </div>
      </form>
    </div>
  );
}

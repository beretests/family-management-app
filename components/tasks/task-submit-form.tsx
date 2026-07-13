"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { submitTask, type TaskActionState } from "@/features/tasks/actions";
import type { TodayTask } from "@/features/tasks/types";

const initialState: TaskActionState = {};

export function TaskSubmitForm({ task }: { task: TodayTask }) {
  const [state, formAction] = useActionState(submitTask, initialState);
  const isClosed = ["submitted", "approved", "cancelled"].includes(task.status);

  if (isClosed) {
    return null;
  }

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="taskId" type="hidden" value={task.id} />
      <ActionMessage error={state.error} success={state.success} />

      {task.completionCheckTextSnapshot ? (
        <p className="rounded-md border border-[var(--line)] p-3 text-sm text-[var(--foreground)]">
          {task.completionCheckTextSnapshot}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
        Note
        <textarea
          className="min-h-24 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
          maxLength={500}
          name="note"
          placeholder={
            task.evidenceTypeSnapshot === "note"
              ? "Add what you finished."
              : "Anything the parent should know?"
          }
        />
      </label>

      {task.requiresEvidenceSnapshot && task.evidenceTypeSnapshot !== "note" ? (
        <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
          Evidence photo
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
            name="evidenceFile"
            type="file"
          />
          <span className="text-xs font-normal text-[var(--muted)]">
            JPEG, PNG, WebP, or GIF. Max 5 MB.
          </span>
        </label>
      ) : null}

      <div>
        <SubmitButton>Submit for review</SubmitButton>
      </div>
    </form>
  );
}

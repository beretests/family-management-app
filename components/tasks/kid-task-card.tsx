import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { TaskSubmitForm } from "@/components/tasks/task-submit-form";
import { TaskSubtaskChecklist } from "@/components/tasks/task-subtask-checklist";
import type { TodayTask } from "@/features/tasks/types";
import { formatTimeRange } from "@/lib/dates/schedule";

const statusTone: Record<string, StatusTone> = {
  approved: "success",
  assigned: "info",
  cancelled: "warning",
  draft: "warning",
  in_progress: "info",
  overdue: "warning",
  rejected: "warning",
  submitted: "success",
};

export function KidTaskCard({
  canSubmit,
  task,
  unavailableMessage = "Sign in as the assigned child profile to update and submit this task.",
}: {
  canSubmit: boolean;
  task: TodayTask;
  unavailableMessage?: string;
}) {
  const completedCount = task.subtasks.filter(
    (subtask) => subtask.completed,
  ).length;

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {task.titleSnapshot}
            </h2>
            <StatusPill tone={statusTone[task.status] ?? "info"}>
              {task.status.replace("_", " ")}
            </StatusPill>
            {task.requiresEvidenceSnapshot ? (
              <StatusPill tone="warning">Evidence</StatusPill>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {task.assignedToName ? `${task.assignedToName} · ` : ""}
            {task.pointsPossible} points · {task.estimatedMinutesSnapshot} min ·
            difficulty {task.difficultySnapshot}/5
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {task.availableFrom && task.dueAt
              ? formatTimeRange(task.availableFrom, task.dueAt, false)
              : "No due time"}
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--accent-strong)]">
          {completedCount}/{task.subtasks.length} done
        </p>
      </div>

      {task.assignmentReason ? (
        <p className="mt-4 rounded-md border border-[var(--line)] p-3 text-sm leading-6 text-[var(--foreground)]">
          {task.assignmentReason}
        </p>
      ) : null}

      {task.rejectionReason ? (
        <p className="mt-4 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          Try again: {task.rejectionReason}
        </p>
      ) : null}

      <TaskSubtaskChecklist canUpdate={canSubmit} task={task} />

      {task.evidenceFiles.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {task.evidenceFiles.map((file) =>
            file.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Submitted task evidence"
                className="aspect-video w-full rounded-md border border-[var(--line)] object-cover"
                key={file.id}
                src={file.signedUrl}
              />
            ) : null,
          )}
        </div>
      ) : null}

      {canSubmit ? (
        <TaskSubmitForm task={task} />
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
          {unavailableMessage}
        </p>
      )}
    </article>
  );
}

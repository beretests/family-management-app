import { updateSubtaskCompletionForm } from "@/features/tasks/actions";
import type { TodayTask } from "@/features/tasks/types";

export function TaskSubtaskChecklist({
  canUpdate,
  task,
}: {
  canUpdate: boolean;
  task: TodayTask;
}) {
  const isClosed = ["submitted", "approved", "cancelled"].includes(task.status);

  if (task.subtasks.length === 0) {
    return (
      <p className="mt-3 rounded-md border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
        No checklist steps for this task.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-2">
      {task.subtasks.map((subtask) => (
        <form action={updateSubtaskCompletionForm} key={subtask.id}>
          <input name="taskId" type="hidden" value={task.id} />
          <input name="subtaskId" type="hidden" value={subtask.id} />
          <input
            name="completed"
            type="hidden"
            value={subtask.completed ? "false" : "true"}
          />
          <button
            className="flex min-h-11 w-full items-center gap-3 rounded-md border border-[var(--line)] px-3 text-left text-sm transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isClosed || !canUpdate}
            type="submit"
          >
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded border border-[var(--line)] font-semibold"
            >
              {subtask.completed ? "x" : ""}
            </span>
            <span
              className={
                subtask.completed
                  ? "text-[var(--muted)] line-through"
                  : "text-[var(--foreground)]"
              }
            >
              {subtask.title}
            </span>
          </button>
        </form>
      ))}
    </div>
  );
}

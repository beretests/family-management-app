import type { TaskInstance } from "@/features/assignments/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { formatTimeRange } from "@/lib/dates/schedule";

export function TaskInstanceList({
  members,
  tasks,
}: {
  members: FamilyMemberWithDetails[];
  tasks: TaskInstance[];
}) {
  const membersById = new Map(members.map((member) => [member.id, member]));

  return (
    <div className="grid gap-3">
      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          No assignments have been created for this day.
        </p>
      ) : null}

      {tasks.map((task) => {
        const member = task.assignedToMemberId
          ? membersById.get(task.assignedToMemberId)
          : null;

        return (
          <article
            className="rounded-md border border-[var(--line)] p-4"
            key={task.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {task.titleSnapshot}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {member?.displayName ?? "Unassigned"} · {task.status} ·{" "}
                  {task.pointsPossible} points ·{" "}
                  {task.dueAt && task.availableFrom
                    ? formatTimeRange(task.availableFrom, task.dueAt, false)
                    : "No due time"}
                </p>
                {task.assignmentReason ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {task.assignmentReason}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-[var(--accent-strong)]">
                {task.estimatedMinutesSnapshot} min
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

import { KidTaskCard } from "@/components/tasks/kid-task-card";
import type { FamilyMember } from "@/features/family/types";
import type { TodayTask } from "@/features/tasks/types";

export function KidTaskList({
  currentMember,
  emptyMessage = "No chores are assigned for today.",
  tasks,
  unavailableMessage = "Sign in as the assigned child profile to update and submit this task.",
}: {
  currentMember: FamilyMember;
  emptyMessage?: string;
  tasks: TodayTask[];
  unavailableMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <KidTaskCard
          canSubmit={task.assignedToMemberId === currentMember.id}
          key={task.id}
          task={task}
          unavailableMessage={unavailableMessage}
        />
      ))}
    </div>
  );
}

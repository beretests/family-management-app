import { redirect } from "next/navigation";
import { KidTaskList } from "@/components/tasks/kid-task-list";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getTodayTasks } from "@/features/tasks/queries";
import { endOfDay, formatDateHeading, startOfDay } from "@/lib/dates/schedule";

export const dynamic = "force-dynamic";

export default async function MyTodayPage() {
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    redirect("/family/setup");
  }

  const today = new Date();
  const isParentView = ["parent", "caregiver"].includes(
    context.currentMember.role,
  );
  const tasks = await getTodayTasks({
    endsAt: endOfDay(today),
    familyId: context.family.id,
    memberId: context.currentMember.id,
    startsAt: startOfDay(today),
    viewAllFamilyTasks: isParentView,
  });
  const openTaskCount = tasks.filter((task) =>
    ["assigned", "in_progress", "rejected"].includes(task.status),
  ).length;

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill tone={isParentView ? "info" : "success"}>
              {isParentView ? "Family view" : "My chores"}
            </StatusPill>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              {formatDateHeading(today)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Check off each step, add a note or photo when needed, and submit
              chores for parent review.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="Tasks" value={tasks.length} />
            <Metric label="Open" value={openTaskCount} />
          </div>
        </div>
      </div>

      <KidTaskList currentMember={context.currentMember} tasks={tasks} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--line)] px-3 py-2">
      <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

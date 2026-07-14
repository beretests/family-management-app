import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignmentPreviewForm } from "@/components/assignments/assignment-preview-form";
import { TaskInstanceList } from "@/components/assignments/task-instance-list";
import { StatusPill } from "@/components/ui/status-pill";
import { generateAssignmentPreview } from "@/features/assignments/engine";
import {
  getTaskInstances,
  getTaskInstancesDueBetween,
} from "@/features/assignments/queries";
import { getChoreTemplates } from "@/features/chores/queries";
import { getFamilyContext } from "@/features/family/queries";
import { getScheduleEvents } from "@/features/schedule/queries";
import {
  addDays,
  endOfDay,
  formatDateHeading,
  parseDateParam,
  startOfDay,
  toDateParam,
} from "@/lib/dates/schedule";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  if (context.currentMember?.role !== "parent") {
    redirect("/dashboard");
  }

  const selectedDate = parseDateParam(params.date);
  const assignmentDate = toDateParam(selectedDate);
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const assignmentWindowStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    15,
    0,
  );
  const assignmentWindowEnd = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    20,
    0,
  );
  const recentStart = addDays(dayStart, -7);
  const dueTime = "18:00";

  const [templates, scheduleEvents, recentTasks, dayTasks] = await Promise.all([
    getChoreTemplates(context.family.id),
    getScheduleEvents({
      endsAt: assignmentWindowEnd,
      familyId: context.family.id,
      startsAt: assignmentWindowStart,
    }),
    getTaskInstances({
      endsAt: dayEnd,
      familyId: context.family.id,
      startsAt: recentStart,
    }),
    getTaskInstancesDueBetween({
      endsAt: dayEnd,
      familyId: context.family.id,
      startsAt: dayStart,
    }),
  ]);
  const previews = generateAssignmentPreview({
    assignmentWindowEnd,
    assignmentWindowStart,
    members: context.members,
    recentTasks,
    scheduleEvents,
    templates,
  });
  const activeChildren = context.members.filter(
    (member) => member.role === "child" && member.lifecycleStatus === "active",
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill tone="info">Assignment engine</StatusPill>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              Plan daily chores
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Preview fair assignments from active chore templates, then adjust
              and create today&apos;s tasks.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="Kids" value={activeChildren.length} />
            <Metric label="Ready" value={previews.length} />
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {formatDateHeading(selectedDate)}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Assignment window is 3:00 PM to 8:00 PM. Due time is 6:00 PM.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DateLink date={addDays(selectedDate, -1)}>Previous</DateLink>
            <DateLink date={new Date()}>Today</DateLink>
            <DateLink date={addDays(selectedDate, 1)}>Next</DateLink>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Preview and adjust
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              The engine scores age, ability, status, schedule conflicts,
              workload, disliked chores, and undesirable rotation.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/chores"
          >
            Manage templates
          </Link>
        </div>
        <AssignmentPreviewForm
          assignmentDate={assignmentDate}
          dueTime={dueTime}
          familyId={context.family.id}
          members={context.members}
          previews={previews}
        />
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Created assignments
        </h2>
        <div className="mt-4">
          <TaskInstanceList members={context.members} tasks={dayTasks} />
        </div>
      </section>
    </section>
  );
}

function DateLink({
  children,
  date,
}: {
  children: React.ReactNode;
  date: Date;
}) {
  return (
    <Link
      className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
      href={`/assignments?date=${toDateParam(date)}`}
    >
      {children}
    </Link>
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

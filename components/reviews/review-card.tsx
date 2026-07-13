import { ReviewActions } from "@/components/reviews/review-actions";
import { StatusPill } from "@/components/ui/status-pill";
import type { ReviewQueueItem } from "@/features/reviews/types";
import { formatTimeRange } from "@/lib/dates/schedule";

export function ReviewCard({
  familyId,
  item,
}: {
  familyId: string;
  item: ReviewQueueItem;
}) {
  const completedCount = item.subtasks.filter(
    (subtask) => subtask.completed,
  ).length;
  const submission = item.submissions[0];

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {item.titleSnapshot}
            </h2>
            <StatusPill tone="info">Submitted</StatusPill>
            {item.requiresEvidenceSnapshot ? (
              <StatusPill tone="warning">Evidence</StatusPill>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {item.assignedToName ?? "Assigned child"} · {item.pointsPossible}{" "}
            points · {item.estimatedMinutesSnapshot} min · difficulty{" "}
            {item.difficultySnapshot}/5
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {item.dueAt
              ? `Due ${new Date(item.dueAt).toLocaleDateString()}`
              : "No due date"}
            {item.submittedAt
              ? ` · submitted ${new Date(item.submittedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--accent-strong)]">
          {completedCount}/{item.subtasks.length} steps
        </p>
      </div>

      {submission?.note ? (
        <p className="mt-4 rounded-md border border-[var(--line)] p-3 text-sm leading-6 text-[var(--foreground)]">
          {submission.note}
        </p>
      ) : null}

      {item.completionCheckTextSnapshot ? (
        <p className="mt-4 rounded-md border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
          {item.completionCheckTextSnapshot}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {item.subtasks.map((subtask) => (
          <div
            className="flex min-h-10 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm"
            key={subtask.id}
          >
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded border border-[var(--line)] font-semibold"
            >
              {subtask.completed ? "x" : ""}
            </span>
            <span
              className={
                subtask.completed ? "text-[var(--muted)] line-through" : ""
              }
            >
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      {item.evidenceFiles.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {item.evidenceFiles.map((file) =>
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
      ) : item.requiresEvidenceSnapshot ? (
        <p className="mt-4 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          This task requires evidence, but no photo is attached.
        </p>
      ) : null}

      {item.dueAt && item.submittedAt ? (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Window: {formatTimeRange(item.dueAt, item.submittedAt, false)}
        </p>
      ) : null}

      <ReviewActions familyId={familyId} item={item} />
    </article>
  );
}

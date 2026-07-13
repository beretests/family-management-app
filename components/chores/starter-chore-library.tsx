import { StatusPill } from "@/components/ui/status-pill";
import type { StarterChoreTemplate } from "@/features/chores/types";

export function StarterChoreLibrary({
  templates,
}: {
  templates: StarterChoreTemplate[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Starter library
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Seeded templates stay read-only until copied into the family library.
          </p>
        </div>
        <StatusPill tone="info">{templates.length} starters</StatusPill>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <article
            className="rounded-md border border-[var(--line)] p-4"
            key={template.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[var(--foreground)]">
                {template.emoji ? `${template.emoji} ` : ""}
                {template.title}
              </h3>
              <StatusPill tone="info">{template.frequency}</StatusPill>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {template.category} · age {template.minimumAge}+ ·{" "}
              {template.estimatedMinutes} min · {template.basePoints} points
            </p>
            {template.safetyNotes ? (
              <p className="mt-2 text-sm text-[var(--warning)]">
                {template.safetyNotes}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

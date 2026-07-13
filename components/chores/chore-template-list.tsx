import { EditChoreTemplateForm } from "@/components/chores/chore-template-form";
import { StatusPill } from "@/components/ui/status-pill";
import type { ChoreTemplate } from "@/features/chores/types";

export function ChoreTemplateList({
  familyId,
  templates,
}: {
  familyId: string;
  templates: ChoreTemplate[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Family templates
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Review templates before the assignment engine uses them.
          </p>
        </div>
        <StatusPill tone="info">{templates.length} templates</StatusPill>
      </div>

      <div className="mt-5 grid gap-4">
        {templates.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            Save the house profile, then generate starter chore templates.
          </p>
        ) : null}

        {templates.map((template) => (
          <TemplateCard familyId={familyId} key={template.id} template={template} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({
  familyId,
  template,
}: {
  familyId: string;
  template: ChoreTemplate;
}) {
  return (
    <article className="rounded-md border border-[var(--line)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {template.emoji ? `${template.emoji} ` : ""}
              {template.title}
            </h3>
            <StatusPill tone={template.active ? "success" : "warning"}>
              {template.active ? "Active" : "Inactive"}
            </StatusPill>
            {template.requiresEvidence ? (
              <StatusPill tone="info">Evidence</StatusPill>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {template.frequency.replace("_", " ")} · {template.category}
            {template.location ? ` · ${template.location}` : ""} · age{" "}
            {template.minimumAge}+
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {template.estimatedMinutes} min · difficulty {template.difficulty}/5 ·{" "}
            {template.basePoints} points · undesirable {template.undesirableScore}/5
          </p>
          {template.description ? (
            <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
              {template.description}
            </p>
          ) : null}
          {template.subtasks.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
              {template.subtasks.slice(0, 5).map((subtask) => (
                <li key={subtask.id}>- {subtask.title}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <details className="mt-4 rounded-md border border-[var(--line)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
          Edit template
        </summary>
        <EditChoreTemplateForm familyId={familyId} template={template} />
      </details>
    </article>
  );
}

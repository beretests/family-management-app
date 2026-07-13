"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  generateFamilyChoreTemplates,
  type ChoreActionState,
} from "@/features/chores/actions";

const initialState: ChoreActionState = {};

export function GenerateChoreTemplatesForm({
  familyId,
  previewCount,
}: {
  familyId: string;
  previewCount: number;
}) {
  const [state, formAction] = useActionState(
    generateFamilyChoreTemplates,
    initialState,
  );

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Generate templates
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Adds starter templates that match the house profile and are not
            already in the family library.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--accent-strong)]">
          {previewCount} ready
        </p>
      </div>

      <form action={formAction} className="mt-4 grid gap-3">
        <input name="familyId" type="hidden" value={familyId} />
        <ActionMessage error={state.error} success={state.success} />
        <div>
          <SubmitButton>Generate chore templates</SubmitButton>
        </div>
      </form>
    </section>
  );
}

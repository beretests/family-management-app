"use client";

import { useActionState } from "react";
import { createFamily, type FamilyActionState } from "@/features/family/actions";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: FamilyActionState = {};

export function FamilySetupForm() {
  const [state, formAction] = useActionState(createFamily, initialState);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
          Family setup
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Create your family workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Start with a parent profile and family name. Child profiles are added
          after this step.
        </p>
      </div>

      <ActionMessage error={state.error} success={state.success} />

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Family name
        <input
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          maxLength={120}
          name="familyName"
          placeholder="The Rivera Family"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Your display name
        <input
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          maxLength={120}
          name="parentDisplayName"
          placeholder="Alex"
          required
        />
      </label>

      <div>
        <SubmitButton>Create family</SubmitButton>
      </div>
    </form>
  );
}

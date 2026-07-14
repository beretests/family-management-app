"use client";

import { useActionState } from "react";
import {
  exitKidMode,
  unlockKidMode,
  type ChildSessionActionState,
} from "@/features/child-session/actions";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: ChildSessionActionState = {};

export function UnlockKidModeForm({
  childrenProfiles,
  familyId,
}: {
  childrenProfiles: FamilyMemberWithDetails[];
  familyId: string;
}) {
  const [state, formAction] = useActionState(unlockKidMode, initialState);
  const availableChildren = childrenProfiles.filter(
    (member) => member.lifecycleStatus === "active",
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <input name="familyId" type="hidden" value={familyId} />
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Start Kid Mode
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Kid Mode gives a child a limited profile on this signed-in parent
        device.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Child
          <select
            className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            name="memberId"
            required
          >
            <option value="">Choose a child</option>
            {availableChildren.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
                {member.hasKidModePin ? "" : " - PIN not set"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          PIN
          <input
            autoComplete="current-password"
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            inputMode="numeric"
            maxLength={8}
            minLength={4}
            name="pin"
            pattern="[0-9]{4,8}"
            required
            type="password"
          />
        </label>
      </div>

      <div className="mt-4">
        <SubmitButton>Unlock</SubmitButton>
      </div>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

export function ExitKidModeForm() {
  return (
    <form action={exitKidMode}>
      <SubmitButton tone="secondary">Exit Kid Mode</SubmitButton>
    </form>
  );
}

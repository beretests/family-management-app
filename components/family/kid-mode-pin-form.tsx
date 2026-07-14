"use client";

import { useActionState } from "react";
import { setChildPin, type FamilyActionState } from "@/features/family/actions";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: FamilyActionState = {};

export function KidModePinForm({
  familyId,
  hasPin,
  memberId,
}: {
  familyId: string;
  hasPin: boolean;
  memberId: string;
}) {
  const [state, formAction] = useActionState(setChildPin, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={memberId} />
      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          {hasPin ? "New PIN" : "PIN"}
          <input
            autoComplete="new-password"
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

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Confirm PIN
          <input
            autoComplete="new-password"
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            inputMode="numeric"
            maxLength={8}
            minLength={4}
            name="confirmPin"
            pattern="[0-9]{4,8}"
            required
            type="password"
          />
        </label>
      </div>

      <p className="text-sm leading-6 text-[var(--muted)]">
        Kid Mode PINs unlock a limited child profile on this signed-in parent
        device. They are not full account passwords.
      </p>

      <div>
        <SubmitButton tone="secondary">
          {hasPin ? "Reset PIN" : "Set PIN"}
        </SubmitButton>
      </div>
    </form>
  );
}

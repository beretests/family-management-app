"use client";

import { useActionState } from "react";
import {
  acceptChildEmailInvitation,
  type FamilyActionState,
} from "@/features/family/actions";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: FamilyActionState = {};

export function AcceptChildEmailInvitationForm({
  invitationId,
}: {
  invitationId: string;
}) {
  const [state, formAction] = useActionState(
    acceptChildEmailInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 grid gap-4">
      <input name="invitationId" type="hidden" value={invitationId} />
      <ActionMessage error={state.error} success={state.success} />
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Create password
        <input
          autoComplete="new-password"
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          minLength={8}
          maxLength={72}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Confirm password
        <input
          autoComplete="new-password"
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          minLength={8}
          maxLength={72}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      <p className="text-xs leading-5 text-[var(--muted)]">
        This creates a separate sign-in for the existing child profile. It does
        not create another family member.
      </p>
      <SubmitButton pendingLabel="Connecting account...">
        Connect to family
      </SubmitButton>
    </form>
  );
}

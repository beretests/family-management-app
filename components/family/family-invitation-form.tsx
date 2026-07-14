"use client";

import { useActionState } from "react";
import {
  acceptFamilyInvitation,
  type FamilyActionState,
} from "@/features/family/actions";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: FamilyActionState = {};

export function AcceptFamilyInvitationForm({
  invitationId,
}: {
  invitationId: string;
}) {
  const [state, formAction] = useActionState(
    acceptFamilyInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 grid gap-4">
      <input name="invitationId" type="hidden" value={invitationId} />
      <ActionMessage error={state.error} success={state.success} />
      <SubmitButton>Join family</SubmitButton>
    </form>
  );
}

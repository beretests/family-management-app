"use client";

import { useActionState } from "react";
import { setMemberStatus, type FamilyActionState } from "@/features/family/actions";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";

const initialState: FamilyActionState = {};

export function MemberStatusForm({
  familyId,
  member,
}: {
  familyId: string;
  member: FamilyMemberWithDetails;
}) {
  const [state, formAction] = useActionState(setMemberStatus, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={member.id} />

      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Status
          <select
            className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={member.currentStatus?.status ?? "normal"}
            name="status"
          >
            <option value="normal">Normal</option>
            <option value="under_the_weather">Under the weather</option>
            <option value="sick">Sick</option>
            <option value="rest_day">Rest day</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Note
          <input
            className="min-h-10 rounded-md border border-[var(--line)] px-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={member.currentStatus?.note ?? ""}
            maxLength={300}
            name="note"
            placeholder="Optional"
          />
        </label>

        <div className="self-end">
          <SubmitButton tone="secondary">Set status</SubmitButton>
        </div>
      </div>
    </form>
  );
}

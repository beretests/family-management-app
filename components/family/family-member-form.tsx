"use client";

import { useActionState } from "react";
import {
  createChildMember,
  type FamilyActionState,
  updateChildMember,
} from "@/features/family/actions";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { birthdateToMonthInput } from "@/lib/dates/age";

const initialState: FamilyActionState = {};

const colorOptions = ["#047857", "#2563eb", "#b45309", "#7c3aed", "#be123c"];

export function AddChildMemberForm({ familyId }: { familyId: string }) {
  const [state, formAction] = useActionState(createChildMember, initialState);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Add a child
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Add birth month, ability, and notes parents should consider when
        assigning work.
      </p>
      <ChildFields
        action={formAction}
        familyId={familyId}
        state={state}
        submitLabel="Add child"
      />
    </section>
  );
}

export function EditChildMemberForm({
  familyId,
  member,
}: {
  familyId: string;
  member: FamilyMemberWithDetails;
}) {
  const [state, formAction] = useActionState(updateChildMember, initialState);

  return (
    <ChildFields
      action={formAction}
      familyId={familyId}
      member={member}
      state={state}
      submitLabel="Save changes"
    />
  );
}

function ChildFields({
  action,
  familyId,
  member,
  state,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  familyId: string;
  member?: FamilyMemberWithDetails;
  state: FamilyActionState;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-4 grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      {member ? <input name="memberId" type="hidden" value={member.id} /> : null}

      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Name
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={member?.displayName}
            maxLength={120}
            name="displayName"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Birth month and year
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={birthdateToMonthInput(member?.birthdate ?? null)}
            name="birthMonth"
            required
            type="month"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,auto)]">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--foreground)]">
          Ability level
          <select
            className="min-h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={member?.abilityLevel ?? 3}
            name="abilityLevel"
          >
            <option value="1">1 - needs help</option>
            <option value="2">2 - learning</option>
            <option value="3">3 - steady</option>
            <option value="4">4 - independent</option>
            <option value="5">5 - advanced</option>
          </select>
        </label>

        <fieldset className="grid min-w-0 gap-2">
          <legend className="text-sm font-medium text-[var(--foreground)]">
            Color
          </legend>
          <div className="flex min-h-11 min-w-0 flex-wrap items-center gap-2">
            {colorOptions.map((color) => (
              <label
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line)]"
                key={color}
                style={{ backgroundColor: color }}
                title={color}
              >
                <input
                  className="sr-only"
                  defaultChecked={(member?.color ?? colorOptions[0]) === color}
                  name="color"
                  type="radio"
                  value={color}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Preferences, dislikes, and safety notes
        <textarea
          className="min-h-24 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={member?.preferences?.notes ?? ""}
          maxLength={500}
          name="notes"
          placeholder="Example: dislikes cleaning bathrooms; avoid heavy lifting."
        />
      </label>

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

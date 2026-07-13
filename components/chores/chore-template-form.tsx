"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  createChoreTemplate,
  deleteChoreTemplate,
  type ChoreActionState,
  updateChoreTemplate,
} from "@/features/chores/actions";
import { choreFrequencies, evidenceTypes } from "@/features/chores/schemas";
import type { ChoreTemplate } from "@/features/chores/types";

const initialState: ChoreActionState = {};

const frequencyLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  seasonal: "Seasonal",
  ad_hoc: "Ad hoc",
};

export function CreateChoreTemplateForm({ familyId }: { familyId: string }) {
  const [state, formAction] = useActionState(createChoreTemplate, initialState);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Add custom template
      </h2>
      <ChoreTemplateFields
        action={formAction}
        familyId={familyId}
        state={state}
        submitLabel="Create template"
      />
    </section>
  );
}

export function EditChoreTemplateForm({
  familyId,
  template,
}: {
  familyId: string;
  template: ChoreTemplate;
}) {
  const [updateState, updateAction] = useActionState(
    updateChoreTemplate,
    initialState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteChoreTemplate,
    initialState,
  );

  return (
    <div className="grid gap-3">
      <ChoreTemplateFields
        action={updateAction}
        familyId={familyId}
        state={updateState}
        submitLabel="Save template"
        template={template}
      />
      <form action={deleteAction}>
        <input name="familyId" type="hidden" value={familyId} />
        <input name="templateId" type="hidden" value={template.id} />
        <ActionMessage error={deleteState.error} success={deleteState.success} />
        <div className="mt-3">
          <SubmitButton tone="danger">Delete template</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function ChoreTemplateFields({
  action,
  familyId,
  state,
  submitLabel,
  template,
}: {
  action: (formData: FormData) => void;
  familyId: string;
  state: ChoreActionState;
  submitLabel: string;
  template?: ChoreTemplate;
}) {
  return (
    <form action={action} className="mt-4 grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      {template ? (
        <input name="templateId" type="hidden" value={template.id} />
      ) : null}
      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-4 md:grid-cols-[120px_1fr_160px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Emoji
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.emoji ?? ""}
            maxLength={24}
            name="emoji"
            placeholder=":broom:"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Title
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.title ?? ""}
            maxLength={140}
            name="title"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Frequency
          <select
            className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.frequency ?? "weekly"}
            name="frequency"
          >
            {choreFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequencyLabels[frequency]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Category
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.category ?? ""}
            maxLength={80}
            name="category"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Location
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.location ?? ""}
            maxLength={120}
            name="location"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <NumberField
          defaultValue={template?.estimatedMinutes ?? 20}
          label="Minutes"
          max={240}
          min={1}
          name="estimatedMinutes"
        />
        <NumberField
          defaultValue={template?.difficulty ?? 2}
          label="Difficulty"
          max={5}
          min={1}
          name="difficulty"
        />
        <NumberField
          defaultValue={template?.basePoints ?? 20}
          label="Points"
          max={500}
          min={0}
          name="basePoints"
        />
        <NumberField
          defaultValue={template?.minimumAge ?? 8}
          label="Min age"
          max={18}
          min={0}
          name="minimumAge"
        />
        <NumberField
          defaultValue={template?.undesirableScore ?? 1}
          label="Unwanted"
          max={5}
          min={0}
          name="undesirableScore"
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Maximum age
        <input
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={template?.maximumAge ?? ""}
          max={18}
          min={0}
          name="maximumAge"
          placeholder="Optional"
          type="number"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-4">
        <CheckboxField
          defaultChecked={template?.requiresParentReview ?? true}
          label="Parent review"
          name="requiresParentReview"
        />
        <CheckboxField
          defaultChecked={template?.requiresEvidence ?? false}
          label="Evidence"
          name="requiresEvidence"
        />
        <CheckboxField
          defaultChecked={template?.active ?? true}
          label="Active"
          name="active"
        />
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Evidence type
          <select
            className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.evidenceType ?? ""}
            name="evidenceType"
          >
            <option value="">None</option>
            {evidenceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Description
        <textarea
          className="min-h-20 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={template?.description ?? ""}
          maxLength={500}
          name="description"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Subtasks
        <textarea
          className="min-h-28 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={template?.subtasks.map((subtask) => subtask.title).join("\n") ?? ""}
          name="subtasks"
          placeholder="One subtask per line"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Completion check
          <textarea
            className="min-h-20 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.completionCheckText ?? ""}
            maxLength={500}
            name="completionCheckText"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Safety notes
          <textarea
            className="min-h-20 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={template?.safetyNotes ?? ""}
            maxLength={500}
            name="safetyNotes"
          />
        </label>
      </div>

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function NumberField({
  defaultValue,
  label,
  max,
  min,
  name,
}: {
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        defaultValue={defaultValue}
        max={max}
        min={min}
        name={name}
        required
        type="number"
      />
    </label>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-[var(--foreground)]">
      <input
        className="size-4"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  );
}

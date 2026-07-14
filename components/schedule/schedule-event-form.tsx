"use client";

import { useActionState, useState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  createScheduleEvent,
  deleteScheduleEvent,
  type ScheduleActionState,
  updateScheduleEvent,
} from "@/features/schedule/actions";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import { scheduleEventTypes } from "@/features/schedule/schemas";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import type { ScheduleEvent } from "@/features/schedule/types";
import { toDateTimeLocalValue } from "@/lib/dates/schedule";

const initialState: ScheduleActionState = {};
const colorOptions = ["", "#047857", "#2563eb", "#b45309", "#7c3aed", "#be123c"];

function addOneHour(dateTimeLocalValue: string) {
  const date = new Date(dateTimeLocalValue);

  if (Number.isNaN(date.getTime())) {
    return dateTimeLocalValue;
  }

  date.setHours(date.getHours() + 1);

  return toDateTimeLocalValue(date.toISOString());
}

export function CreateScheduleEventForm({
  defaultEndsAt,
  defaultStartsAt,
  familyId,
  members,
}: {
  defaultEndsAt: string;
  defaultStartsAt: string;
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const [state, formAction] = useActionState(createScheduleEvent, initialState);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <details>
        <summary className="cursor-pointer text-xl font-semibold text-[var(--foreground)]">
          Add schedule item
        </summary>
        <ScheduleEventFields
          action={formAction}
          defaultEndsAt={defaultEndsAt}
          defaultStartsAt={defaultStartsAt}
          familyId={familyId}
          members={members}
          state={state}
          submitLabel="Add event"
        />
      </details>
    </section>
  );
}

export function EditScheduleEventForm({
  event,
  familyId,
  members,
}: {
  event: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const [updateState, updateAction] = useActionState(
    updateScheduleEvent,
    initialState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteScheduleEvent,
    initialState,
  );

  return (
    <div className="grid gap-3">
      <ScheduleEventFields
        action={updateAction}
        event={event}
        familyId={familyId}
        members={members}
        state={updateState}
        submitLabel="Save"
      />
      <form action={deleteAction}>
        <input name="familyId" type="hidden" value={familyId} />
        <input name="eventId" type="hidden" value={event.id} />
        <ActionMessage error={deleteState.error} success={deleteState.success} />
        <div className="mt-3">
          <SubmitButton tone="danger">Delete event</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function ScheduleEventFields({
  action,
  defaultEndsAt,
  defaultStartsAt,
  event,
  familyId,
  members,
  state,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultEndsAt?: string;
  defaultStartsAt?: string;
  event?: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
  state: ScheduleActionState;
  submitLabel: string;
}) {
  const initialStartsAt = event
    ? toDateTimeLocalValue(event.startsAt)
    : toDateTimeLocalValue(defaultStartsAt);
  const initialEndsAt = event
    ? toDateTimeLocalValue(event.endsAt)
    : toDateTimeLocalValue(defaultEndsAt);
  const [startsAt, setStartsAt] = useState(initialStartsAt);
  const [endsAt, setEndsAt] = useState(
    new Date(initialEndsAt).getTime() > new Date(initialStartsAt).getTime()
      ? initialEndsAt
      : addOneHour(initialStartsAt),
  );
  const [wholeFamily, setWholeFamily] = useState(
    (event?.memberIds.length ?? 0) === 0,
  );
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus === "active",
  );
  const selectedMemberIds = new Set(event?.memberIds ?? []);

  function handleStartsAtChange(value: string) {
    setStartsAt(value);

    if (new Date(endsAt).getTime() <= new Date(value).getTime()) {
      setEndsAt(addOneHour(value));
    }
  }

  function handleEndsAtChange(value: string) {
    setEndsAt(
      new Date(value).getTime() <= new Date(startsAt).getTime()
        ? addOneHour(startsAt)
        : value,
    );
  }

  return (
    <form action={action} className="mt-4 grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      {event ? <input name="eventId" type="hidden" value={event.id} /> : null}

      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Title
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={event?.title}
            maxLength={140}
            name="title"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Type
          <select
            className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={event?.eventType ?? "extracurricular"}
            name="eventType"
          >
            {scheduleEventTypes.map((type) => (
              <option key={type} value={type}>
                {scheduleEventTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Starts
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            name="startsAt"
            onChange={(event) => handleStartsAtChange(event.target.value)}
            required
            type="datetime-local"
            value={startsAt}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Ends
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            min={startsAt}
            name="endsAt"
            onChange={(event) => handleEndsAtChange(event.target.value)}
            required
            type="datetime-local"
            value={endsAt}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-[var(--foreground)]">
            Family members
          </legend>
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-[var(--foreground)]">
            <input
              checked={wholeFamily}
              className="size-4"
              name="wholeFamily"
              onChange={(event) => setWholeFamily(event.target.checked)}
              type="checkbox"
            />
            Whole family
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeMembers.map((member) => (
              <label
                className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm text-[var(--foreground)]"
                key={member.id}
              >
                <input
                  className="size-4"
                  defaultChecked={selectedMemberIds.has(member.id)}
                  disabled={wholeFamily}
                  name="memberIds"
                  onChange={() => setWholeFamily(false)}
                  type="checkbox"
                  value={member.id}
                />
                {member.displayName}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-[var(--foreground)]">
            Color
          </legend>
          <div className="flex min-h-11 flex-wrap items-center gap-2">
            {colorOptions.map((color) => (
              <label
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-[var(--line)] text-xs font-semibold"
                key={color || "default"}
                style={{ backgroundColor: color || "#ffffff" }}
                title={color || "Use member color"}
              >
                <input
                  className="sr-only"
                  defaultChecked={(event?.color ?? "") === color}
                  name="color"
                  type="radio"
                  value={color}
                />
                {color ? "" : "Auto"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Location
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={event?.location ?? ""}
            maxLength={160}
            name="location"
          />
        </label>

        <label className="flex min-h-11 items-end gap-2 pb-2 text-sm font-medium text-[var(--foreground)]">
          <input
            className="size-4"
            defaultChecked={event?.allDay ?? false}
            name="allDay"
            type="checkbox"
          />
          All day
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Notes
        <textarea
          className="min-h-20 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={event?.description ?? ""}
          maxLength={500}
          name="description"
        />
      </label>

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
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
import type { ScheduleEventEditScope } from "@/features/schedule/types";
import { getRecurrenceOccurrenceNumber } from "@/features/schedule/recurrence";
import { addDaysToDateKey } from "@/features/schedule/all-day";
import { toDateTimeLocalValue } from "@/lib/dates/schedule";

const initialState: ScheduleActionState = {};
const colorOptions = [
  "",
  "#047857",
  "#2563eb",
  "#b45309",
  "#7c3aed",
  "#be123c",
];

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
  actorMemberId,
  canManageAll,
  onSuccess,
  timeZone,
}: {
  defaultEndsAt: string;
  defaultStartsAt: string;
  familyId: string;
  members: FamilyMemberWithDetails[];
  actorMemberId: string;
  canManageAll: boolean;
  onSuccess?: (message: string) => void;
  timeZone: string;
}) {
  const [state, formAction, pending] = useActionState(
    createScheduleEvent,
    initialState,
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (state.submissionId && state.success && !state.error) {
      onSuccess?.(state.success);
    }
  }, [onSuccess, state.error, state.submissionId, state.success]);

  return (
    <ScheduleEventFields
      key={state.submissionId ?? "new-event"}
      action={formAction}
      defaultEndsAt={defaultEndsAt}
      defaultStartsAt={defaultStartsAt}
      familyId={familyId}
      members={members}
      actorMemberId={actorMemberId}
      canManageAll={canManageAll}
      idempotencyKey={idempotencyKey}
      pending={pending}
      state={state}
      submitLabel="Add event"
      timeZone={timeZone}
    />
  );
}

export function EditScheduleEventForm({
  event,
  familyId,
  members,
  actorMemberId,
  canDelete,
  canManageAll,
  timeZone,
}: {
  event: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
  actorMemberId: string;
  canDelete: boolean;
  canManageAll: boolean;
  timeZone: string;
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
        actorMemberId={actorMemberId}
        canManageAll={canManageAll}
        state={updateState}
        submitLabel="Save"
        timeZone={timeZone}
      />
      {canDelete ? (
        <form
          action={deleteAction}
          onSubmit={(submitEvent) => {
            const data = new FormData(submitEvent.currentTarget);
            const scope = data.get("editScope");
            const label =
              !event.recurrence || scope === "occurrence"
                ? "this event"
                : scope === "following"
                  ? "this and all following events"
                  : "the entire series";

            if (!window.confirm(`Delete ${label}?`)) {
              submitEvent.preventDefault();
            }
          }}
        >
          <input name="familyId" type="hidden" value={familyId} />
          <input
            name="eventId"
            type="hidden"
            value={event.sourceEventId ?? event.id}
          />
          <input
            name="occurrenceDate"
            type="hidden"
            value={event.occurrenceDate ?? ""}
          />
          <DeleteScopeFields event={event} />
          <ActionMessage
            error={deleteState.error}
            success={deleteState.success}
          />
          <div className="mt-3">
            <SubmitButton pendingLabel="Deleting..." tone="danger">
              Delete event
            </SubmitButton>
          </div>
        </form>
      ) : null}
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
  actorMemberId,
  canManageAll,
  idempotencyKey,
  pending = false,
  state,
  submitLabel,
  timeZone: calendarTimeZone,
}: {
  action: (formData: FormData) => void;
  defaultEndsAt?: string;
  defaultStartsAt?: string;
  event?: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
  actorMemberId: string;
  canManageAll: boolean;
  idempotencyKey?: string;
  pending?: boolean;
  state: ScheduleActionState;
  submitLabel: string;
  timeZone: string;
}) {
  const formTimeZone = calendarTimeZone;
  const initialStartsAt = event
    ? toDateTimeLocalValue(event.startsAt, formTimeZone)
    : toDateTimeLocalValue(defaultStartsAt, formTimeZone);
  const initialEndsAt = event
    ? toDateTimeLocalValue(event.endsAt, formTimeZone)
    : toDateTimeLocalValue(defaultEndsAt, formTimeZone);
  const [startsAt, setStartsAt] = useState(initialStartsAt);
  const [endsAt, setEndsAt] = useState(
    new Date(initialEndsAt).getTime() > new Date(initialStartsAt).getTime()
      ? initialEndsAt
      : addOneHour(initialStartsAt),
  );
  const [eventType, setEventType] = useState(
    event?.eventType ?? "extracurricular",
  );
  const [allDay, setAllDay] = useState(
    event?.eventType === "no_school" || (event?.allDay ?? false),
  );
  const [allDayStartsOn, setAllDayStartsOn] = useState(
    initialStartsAt.slice(0, 10),
  );
  const [allDayEndsOn, setAllDayEndsOn] = useState(
    event?.allDay
      ? addDaysToDateKey(initialEndsAt.slice(0, 10), -1)
      : initialStartsAt.slice(0, 10),
  );
  const [wholeFamily, setWholeFamily] = useState(
    canManageAll && (event?.memberIds.length ?? 0) === 0,
  );
  const initialRepeatType = event?.recurrence
    ? event.recurrence.frequency === "weekly" &&
      event.recurrence.weekdays.length
      ? "custom"
      : event.recurrence.frequency
    : "none";
  const [repeatType, setRepeatType] = useState(initialRepeatType);
  const [recurrenceEndType, setRecurrenceEndType] = useState(
    event?.recurrence?.endsOn
      ? "on"
      : event?.recurrence?.occurrenceCount
        ? "after"
        : "never",
  );
  const [editScope, setEditScope] = useState<ScheduleEventEditScope>(
    event?.recurrence ? "occurrence" : "series",
  );
  const occurrenceNumber =
    event?.recurrence && event.occurrenceDate
      ? getRecurrenceOccurrenceNumber({
          occurrenceDate: event.occurrenceDate,
          recurrence: event.recurrence,
          seriesStartsAt: event.seriesStartsAt ?? event.startsAt,
        })
      : null;
  const remainingOccurrenceCount = event?.recurrence?.occurrenceCount
    ? Math.max(
        1,
        event.recurrence.occurrenceCount - (occurrenceNumber ?? 1) + 1,
      )
    : null;
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus === "active",
  );
  const selectedMemberIds = new Set(
    canManageAll ? (event?.memberIds ?? []) : [actorMemberId],
  );

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

  function handleEditScopeChange(scope: ScheduleEventEditScope) {
    setEditScope(scope);

    if (!event) {
      return;
    }

    const useSeriesStart = scope === "series";
    const nextStartsAt = toDateTimeLocalValue(
      useSeriesStart
        ? (event.seriesStartsAt ?? event.startsAt)
        : event.startsAt,
      formTimeZone,
    );
    const nextEndsAt = toDateTimeLocalValue(
      useSeriesStart ? (event.seriesEndsAt ?? event.endsAt) : event.endsAt,
      formTimeZone,
    );
    setStartsAt(nextStartsAt);
    setEndsAt(nextEndsAt);
    setAllDayStartsOn(nextStartsAt.slice(0, 10));
    setAllDayEndsOn(
      event.allDay
        ? addDaysToDateKey(nextEndsAt.slice(0, 10), -1)
        : nextStartsAt.slice(0, 10),
    );
  }

  return (
    <form
      action={action}
      aria-busy={pending}
      className="mt-4 min-w-0 grid gap-4"
    >
      <input name="familyId" type="hidden" value={familyId} />
      {idempotencyKey ? (
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      ) : null}
      {!canManageAll ? (
        <input name="memberIds" type="hidden" value={actorMemberId} />
      ) : null}
      {event ? (
        <input
          name="eventId"
          type="hidden"
          value={event.sourceEventId ?? event.id}
        />
      ) : null}
      {event?.occurrenceDate ? (
        <input
          name="occurrenceDate"
          type="hidden"
          value={event.occurrenceDate}
        />
      ) : null}
      <input
        name="timeZone"
        suppressHydrationWarning
        type="hidden"
        value={formTimeZone}
      />
      <input name="allDay" type="hidden" value={allDay ? "on" : ""} />

      <p className="text-xs text-[var(--muted)]">Times use {formTimeZone}.</p>

      <ActionMessage error={state.error} success={state.success} />

      {event?.recurrence ? (
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Apply changes to
          <select
            className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
            name="editScope"
            onChange={(changeEvent) =>
              handleEditScopeChange(
                changeEvent.target.value as ScheduleEventEditScope,
              )
            }
            value={editScope}
          >
            <option value="occurrence">This event</option>
            <option value="following">This and following events</option>
            <option value="series">Entire series</option>
          </select>
        </label>
      ) : (
        <input name="editScope" type="hidden" value="series" />
      )}

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
            name="eventType"
            onChange={(changeEvent) => {
              const nextType = changeEvent.target
                .value as ScheduleEvent["eventType"];
              setEventType(nextType);

              if (nextType === "no_school") {
                setAllDay(true);
              }
            }}
            value={eventType}
          >
            {scheduleEventTypes.map((type) => (
              <option key={type} value={type}>
                {scheduleEventTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {allDay ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="startsAt"
            type="hidden"
            value={`${allDayStartsOn}T00:00`}
          />
          <input
            name="endsAt"
            type="hidden"
            value={`${addDaysToDateKey(allDayEndsOn, 1)}T00:00`}
          />
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            First day
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              onChange={(changeEvent) => {
                const nextDate = changeEvent.target.value;
                setAllDayStartsOn(nextDate);

                if (allDayEndsOn < nextDate) {
                  setAllDayEndsOn(nextDate);
                }
              }}
              required
              type="date"
              value={allDayStartsOn}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Last day
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              min={allDayStartsOn}
              onChange={(changeEvent) =>
                setAllDayEndsOn(changeEvent.target.value)
              }
              required
              type="date"
              value={allDayEndsOn}
            />
          </label>
        </div>
      ) : (
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
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-[var(--foreground)]">
            Family members
          </legend>
          {canManageAll ? (
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
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {activeMembers
              .filter((member) => canManageAll || member.id === actorMemberId)
              .map((member) => (
                <label
                  className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm text-[var(--foreground)]"
                  key={member.id}
                >
                  <input
                    className="size-4"
                    defaultChecked={selectedMemberIds.has(member.id)}
                    disabled={wholeFamily || !canManageAll}
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

      {editScope !== "occurrence" ? (
        <fieldset className="grid gap-3 rounded-lg border border-[var(--line)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--foreground)]">
            Repeat
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Repeats
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
                name="repeatType"
                onChange={(changeEvent) =>
                  setRepeatType(changeEvent.target.value)
                }
                value={repeatType}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom weekdays</option>
              </select>
            </label>
            {repeatType !== "none" ? (
              <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                Repeat every
                <span className="flex items-center gap-2">
                  <input
                    className="min-h-11 w-24 rounded-md border border-[var(--line)] px-3 text-base"
                    defaultValue={event?.recurrence?.interval ?? 1}
                    max={365}
                    min={1}
                    name="recurrenceInterval"
                    type="number"
                  />
                  {repeatType === "yearly"
                    ? "year(s)"
                    : repeatType === "daily"
                      ? "day(s)"
                      : "week(s)"}
                </span>
              </label>
            ) : null}
          </div>

          {repeatType === "custom" ? (
            <fieldset>
              <legend className="text-sm font-medium text-[var(--foreground)]">
                Weekdays
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (label, index) => (
                    <label
                      className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm"
                      key={label}
                    >
                      <input
                        defaultChecked={
                          event?.recurrence?.weekdays.includes(index) ??
                          (index >= 1 && index <= 5)
                        }
                        name="recurrenceWeekdays"
                        type="checkbox"
                        value={index}
                      />
                      {label}
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          ) : null}

          {repeatType !== "none" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                Series ends
                <select
                  className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
                  name="recurrenceEndType"
                  onChange={(changeEvent) =>
                    setRecurrenceEndType(changeEvent.target.value)
                  }
                  value={recurrenceEndType}
                >
                  <option value="never">Never</option>
                  <option value="on">On date</option>
                  <option value="after">After occurrences</option>
                </select>
              </label>
              {recurrenceEndType === "on" ? (
                <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                  End date
                  <input
                    className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
                    defaultValue={event?.recurrence?.endsOn ?? ""}
                    name="recurrenceEndsOn"
                    required
                    type="date"
                  />
                </label>
              ) : null}
              {recurrenceEndType === "after" ? (
                <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                  Number of occurrences
                  <input
                    className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
                    defaultValue={
                      editScope === "following"
                        ? (remainingOccurrenceCount ?? 10)
                        : (event?.recurrence?.occurrenceCount ?? 10)
                    }
                    max={1000}
                    min={1}
                    name="recurrenceCount"
                    required
                    type="number"
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {event?.recurrence ? (
            <p className="text-xs text-[var(--muted)]">
              {editScope === "following"
                ? "The earlier events stay unchanged and a new series starts here."
                : "Changes apply to the entire series."}
            </p>
          ) : null}
        </fieldset>
      ) : event?.recurrence ? (
        <p className="rounded-md bg-[var(--info-soft)] p-3 text-sm text-[var(--info)]">
          Only this occurrence will change. The rest of the series stays the
          same.
        </p>
      ) : null}

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
            checked={allDay}
            className="size-4"
            disabled={eventType === "no_school"}
            onChange={(changeEvent) => {
              setAllDay(changeEvent.target.checked);

              if (changeEvent.target.checked) {
                const startsOn = startsAt.slice(0, 10);
                setAllDayStartsOn(startsOn);
                setAllDayEndsOn(startsOn);
              }
            }}
            type="checkbox"
          />
          All day
        </label>
      </div>

      {eventType === "no_school" ? (
        <p className="rounded-md bg-[var(--info-soft)] p-3 text-sm text-[var(--info)]">
          No School entries are always saved as all-day events.
        </p>
      ) : null}

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
        <SubmitButton pendingLabel="Saving event...">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

function DeleteScopeFields({ event }: { event: ScheduleEvent }) {
  if (!event.recurrence) {
    return <input name="editScope" type="hidden" value="series" />;
  }

  return (
    <label className="mt-3 grid gap-2 text-sm font-medium text-[var(--foreground)]">
      Delete
      <select
        className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
        defaultValue="occurrence"
        name="editScope"
      >
        <option value="occurrence">This event</option>
        <option value="following">This and following events</option>
        <option value="series">Entire series</option>
      </select>
    </label>
  );
}

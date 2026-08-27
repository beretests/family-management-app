"use client";

import { useActionState, useState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import {
  findDuplicateIcsUids,
  importIcsEvents,
  type IcsImportActionState,
} from "@/features/schedule/ics/actions";
import {
  MAX_ICS_FILE_BYTES,
  MAX_ICS_IMPORT_EVENTS,
  parseIcsCalendar,
} from "@/features/schedule/ics/parser";
import type {
  IcsPreview,
  IcsPreviewEvent,
} from "@/features/schedule/ics/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import { scheduleEventTypes } from "@/features/schedule/schemas";

const initialState: IcsImportActionState = {};

export function IcsImportForm({
  actorMemberId,
  canManageAll,
  familyId,
  members,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const [state, formAction] = useActionState(importIcsEvents, initialState);
  const [preview, setPreview] = useState<IcsPreview | null>(null);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [previewError, setPreviewError] = useState<string>();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [wholeFamily, setWholeFamily] = useState(false);
  const browserTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus === "active",
  );

  async function previewFile(form: HTMLFormElement) {
    setPreviewError(undefined);
    setPreview(null);
    setSelectedUids(new Set());
    const input = form.elements.namedItem("calendarFile");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : null;

    if (!file) {
      setPreviewError("Choose an .ics calendar file.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".ics")) {
      setPreviewError("Choose a file whose name ends in .ics.");
      return;
    }

    if (file.size > MAX_ICS_FILE_BYTES) {
      setPreviewError("Calendar files must be 512 KB or smaller.");
      return;
    }

    setIsPreviewing(true);

    try {
      const parsed = parseIcsCalendar(await file.text(), {
        fallbackTimeZone: browserTimeZone,
      });
      const databaseDuplicates = new Set(
        await findDuplicateIcsUids({
          familyId,
          uids: parsed.events
            .filter((event) => event.status === "ready")
            .map((event) => event.uid),
        }),
      );
      const events = parsed.events.map((event) =>
        databaseDuplicates.has(event.uid)
          ? {
              ...event,
              status: "duplicate" as const,
              reasons: [...event.reasons, "This event was already imported."],
            }
          : event,
      );
      const nextPreview = summarize(events);
      const nextSelected = nextPreview.events
        .filter((event) => event.status === "ready")
        .slice(0, MAX_ICS_IMPORT_EVENTS)
        .map((event) => event.uid);

      setPreview(nextPreview);
      setSelectedUids(new Set(nextSelected));
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Could not preview the file.",
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  function toggleUid(uid: string, checked: boolean) {
    setSelectedUids((current) => {
      const next = new Set(current);

      if (checked) {
        if (next.size < MAX_ICS_IMPORT_EVENTS) {
          next.add(uid);
        }
      } else {
        next.delete(uid);
      }

      return next;
    });
  }

  return (
    <section className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <details>
        <summary className="cursor-pointer text-xl font-semibold text-[var(--foreground)]">
          Import calendar file
        </summary>
        <form action={formAction} className="mt-4 min-w-0 grid gap-5">
          <input name="familyId" type="hidden" value={familyId} />
          <input
            name="browserTimeZone"
            suppressHydrationWarning
            type="hidden"
            value={browserTimeZone}
          />
          {!canManageAll ? (
            <input name="memberIds" type="hidden" value={actorMemberId} />
          ) : null}

          <ActionMessage
            error={previewError ?? state.error}
            success={state.success}
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              iCalendar file
              <input
                accept=".ics,text/calendar"
                className="min-h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-white px-2 py-2 text-sm file:mr-2 file:max-w-full file:rounded-md file:border-0 file:bg-[var(--accent-soft)] file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--accent-strong)] sm:px-3 sm:file:mr-3 sm:file:px-3 sm:file:text-sm"
                name="calendarFile"
                onChange={() => {
                  setPreview(null);
                  setPreviewError(undefined);
                  setSelectedUids(new Set());
                }}
                required
                type="file"
              />
              <span className="text-xs font-normal text-[var(--muted)]">
                Maximum 512 KB and 500 events. The file stays in memory and is
                not stored.
              </span>
            </label>
            <button
              className="min-h-11 rounded-md border border-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPreviewing}
              onClick={(clickEvent) =>
                void previewFile(
                  clickEvent.currentTarget.form as HTMLFormElement,
                )
              }
              type="button"
            >
              {isPreviewing ? "Checking..." : "Preview events"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Import as
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
                defaultValue="family_event"
                name="eventType"
              >
                {scheduleEventTypes.map((type) => (
                  <option key={type} value={type}>
                    {scheduleEventTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-[var(--foreground)]">
                Calendar members
              </legend>
              {canManageAll ? (
                <label className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-medium">
                  <input
                    checked={wholeFamily}
                    className="size-4"
                    name="wholeFamily"
                    onChange={(changeEvent) =>
                      setWholeFamily(changeEvent.target.checked)
                    }
                    type="checkbox"
                  />
                  Whole family
                </label>
              ) : (
                <p className="flex min-h-11 items-center rounded-md border border-[var(--line)] px-3 text-sm">
                  Import to your calendar
                </p>
              )}
            </fieldset>
          </div>

          {canManageAll ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeMembers.map((member) => (
                <label
                  className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm"
                  key={member.id}
                >
                  <input
                    className="size-4"
                    defaultChecked={member.id === actorMemberId}
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
          ) : null}

          {preview ? (
            <PreviewList
              browserTimeZone={browserTimeZone}
              preview={preview}
              selectedUids={selectedUids}
              toggleUid={toggleUid}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton
              disabled={!preview || selectedUids.size === 0}
              pendingLabel="Importing events..."
            >
              Import {selectedUids.size || "selected"} event
              {selectedUids.size === 1 ? "" : "s"}
            </SubmitButton>
            <span className="text-xs text-[var(--muted)]">
              Up to {MAX_ICS_IMPORT_EVENTS} events per import. Existing UIDs are
              skipped.
            </span>
          </div>
        </form>
      </details>
    </section>
  );
}

function PreviewList({
  browserTimeZone,
  preview,
  selectedUids,
  toggleUid,
}: {
  browserTimeZone: string;
  preview: IcsPreview;
  selectedUids: Set<string>;
  toggleUid: (uid: string, checked: boolean) => void;
}) {
  return (
    <section aria-label="Calendar import preview" className="grid gap-3">
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-strong)]">
          {preview.readyCount} ready
        </span>
        <span className="rounded-full bg-[var(--info-soft)] px-3 py-1 text-[var(--info)]">
          {preview.duplicateCount} duplicates
        </span>
        <span className="rounded-full bg-[var(--warning-soft)] px-3 py-1 text-[var(--warning)]">
          {preview.unsupportedCount} unsupported
        </span>
      </div>
      {preview.readyCount > MAX_ICS_IMPORT_EVENTS ? (
        <p className="text-sm text-[var(--muted)]">
          The first {MAX_ICS_IMPORT_EVENTS} supported events are selected. You
          can change the selection, up to that limit.
        </p>
      ) : null}
      <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {preview.events.map((event, index) => {
          const ready = event.status === "ready";
          const selected = selectedUids.has(event.uid);

          return (
            <li
              className="rounded-lg border border-[var(--line)] bg-white p-3"
              key={`${event.uid || "unsupported"}-${index}`}
            >
              <label className="flex items-start gap-3">
                <input
                  checked={selected}
                  className="mt-1 size-4"
                  disabled={
                    !ready ||
                    (!selected && selectedUids.size >= MAX_ICS_IMPORT_EVENTS)
                  }
                  name={ready ? "selectedUids" : undefined}
                  onChange={(changeEvent) =>
                    toggleUid(event.uid, changeEvent.target.checked)
                  }
                  type="checkbox"
                  value={event.uid}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-[var(--foreground)]">
                      {event.title}
                    </strong>
                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">
                      {event.status}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {formatEventDate(event, browserTimeZone)}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                  {event.recurrence ? (
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      Repeats {event.recurrence.frequency}
                    </span>
                  ) : null}
                  {[...event.reasons, ...event.warnings].map((message) => (
                    <span
                      className="mt-1 block text-xs text-[var(--warning)]"
                      key={message}
                    >
                      {message}
                    </span>
                  ))}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatEventDate(event: IcsPreviewEvent, timeZone: string) {
  if (!event.startsAt) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: event.allDay ? undefined : "short",
    timeZone,
  }).format(new Date(event.startsAt));
}

function summarize(events: IcsPreviewEvent[]): IcsPreview {
  return {
    events,
    readyCount: events.filter((event) => event.status === "ready").length,
    duplicateCount: events.filter((event) => event.status === "duplicate")
      .length,
    unsupportedCount: events.filter((event) => event.status === "unsupported")
      .length,
  };
}

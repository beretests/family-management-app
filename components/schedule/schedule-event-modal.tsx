"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { EditScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { StatusPill } from "@/components/ui/status-pill";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { scheduleEventTypeLabels } from "@/features/schedule/labels";
import type { ScheduleEvent } from "@/features/schedule/types";
import { formatTimeRange } from "@/lib/dates/schedule";

export function ScheduleEventModal({
  actorMemberId,
  canManageAll,
  conflicts,
  event,
  familyId,
  members,
  onClose,
  timeZone,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  conflicts: string[];
  event: ScheduleEvent;
  familyId: string;
  members: FamilyMemberWithDetails[];
  onClose: () => void;
  timeZone: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const attendees = members.filter((member) =>
    event.memberIds.includes(member.id),
  );
  const attendeeLabel =
    attendees.length > 0
      ? attendees.map((member) => member.displayName).join(", ")
      : "Whole family";
  const canEdit = canManageAll || event.createdByMemberId === actorMemberId;

  useEffect(() => {
    const dialog = dialogRef.current;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow;

      if (dialog?.open && typeof dialog.close === "function") {
        dialog.close();
      }

      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-slate-950/55 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]"
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        onClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          onClose();
        }
      }}
      ref={dialogRef}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-strong)]">
            Event details
          </p>
          <h2
            className="mt-1 break-words text-xl font-extrabold sm:text-2xl"
            id={titleId}
          >
            {event.title}
          </h2>
        </div>
        <button
          aria-label="Close event details"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="grid gap-5 p-4 sm:p-6">
        <div className="grid gap-3 rounded-lg bg-[#f7fafc] p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">
              {scheduleEventTypeLabels[event.eventType]}
            </StatusPill>
            {conflicts.length > 0 ? (
              <StatusPill tone="warning">Conflict</StatusPill>
            ) : null}
            {event.recurrence ? (
              <StatusPill tone="info">
                Repeats {event.recurrence.frequency}
              </StatusPill>
            ) : null}
          </div>
          <p className="font-semibold">
            {formatTimeRange(
              event.startsAt,
              event.endsAt,
              event.allDay,
              timeZone,
            )}
          </p>
          <p className="break-words text-[var(--muted)]">{attendeeLabel}</p>
          {event.location ? (
            <p className="break-words text-[var(--muted)]">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="whitespace-pre-wrap break-words leading-6">
              {event.description}
            </p>
          ) : null}
        </div>

        {canEdit ? (
          <details className="rounded-lg border border-[var(--line)] p-3 sm:p-4">
            <summary className="min-h-11 cursor-pointer content-center font-bold">
              Edit event
            </summary>
            <EditScheduleEventForm
              actorMemberId={actorMemberId}
              canDelete={canManageAll}
              canManageAll={canManageAll}
              event={event}
              familyId={familyId}
              members={members}
              timeZone={timeZone}
            />
          </details>
        ) : null}
      </div>
    </dialog>
  );
}

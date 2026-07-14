"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  dismissReminder,
  type ReminderActionState,
} from "@/features/reminders/actions";
import type { Reminder, ReminderType } from "@/features/reminders/types";

const initialState: ReminderActionState = {};

const reminderTypeLabels: Record<ReminderType, string> = {
  chore_due_soon: "Due soon",
  chore_overdue: "Catch up",
  reward_redemption_pending: "Reward review",
  schedule_conflict: "Schedule",
  submission_pending_review: "Review",
  submission_rejected: "Feedback",
};

export function ReminderList({
  familyId,
  reminders,
}: {
  familyId: string;
  reminders: Reminder[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Reminder center
      </h2>
      <div className="mt-4 grid gap-3">
        {reminders.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            No active reminders right now.
          </p>
        ) : null}
        {reminders.map((reminder) => (
          <ReminderCard
            familyId={familyId}
            key={reminder.id}
            reminder={reminder}
          />
        ))}
      </div>
    </section>
  );
}

function ReminderCard({
  familyId,
  reminder,
}: {
  familyId: string;
  reminder: Reminder;
}) {
  const [state, formAction] = useActionState(dismissReminder, initialState);

  return (
    <article className="rounded-md border border-[var(--line)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent-strong)]">
            {reminderTypeLabels[reminder.reminderType]}
          </p>
          <h3 className="mt-1 font-semibold text-[var(--foreground)]">
            {reminder.message}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(reminder.remindAt))}
          </p>
        </div>
        <form action={formAction}>
          <input name="familyId" type="hidden" value={familyId} />
          <input name="reminderId" type="hidden" value={reminder.id} />
          <SubmitButton tone="secondary">Dismiss</SubmitButton>
        </form>
      </div>
      <div className="mt-3">
        <ActionMessage error={state.error} success={state.success} />
      </div>
    </article>
  );
}

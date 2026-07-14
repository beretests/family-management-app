"use client";

import { useMemo, useState } from "react";
import type { Reminder } from "@/features/reminders/types";

export function BrowserNotificationButton({
  reminders,
}: {
  reminders: Reminder[];
}) {
  const [status, setStatus] = useState<string | null>(null);
  const nextReminder = useMemo(
    () =>
      reminders.sort(
        (left, right) =>
          new Date(left.remindAt).getTime() -
          new Date(right.remindAt).getTime(),
      )[0] ?? null,
    [reminders],
  );

  async function enableNotifications() {
    const supported = "Notification" in window;

    if (!supported) {
      setStatus("Browser notifications are not supported here.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setStatus("Notifications were not enabled.");
      return;
    }

    if (nextReminder) {
      new Notification("Family Chore Hub", {
        body: nextReminder.message,
      });
    }

    setStatus("Notifications are enabled for this browser.");
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Browser notifications
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Optional local browser alerts. No SMS, email, or paid provider is used.
      </p>
      <button
        className="mt-4 min-h-10 rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={enableNotifications}
        type="button"
      >
        Enable alerts
      </button>
      {status ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{status}</p>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { BrowserNotificationButton } from "@/components/reminders/browser-notification-button";
import { ReminderList } from "@/components/reminders/reminder-list";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getReminders } from "@/features/reminders/queries";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="warning">Setup needed</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Create your family workspace
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Reminders are available after family setup.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href="/family/setup"
        >
          Start family setup
        </Link>
      </section>
    );
  }

  const reminders = await getReminders({
    familyId: context.family.id,
    limit: 50,
  });

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Free first</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Reminders
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Family reminders stay in the app by default. Browser alerts are
          optional, and SMS/email providers are not connected.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <ReminderList familyId={context.family.id} reminders={reminders} />
        <BrowserNotificationButton reminders={reminders} />
      </div>
    </section>
  );
}

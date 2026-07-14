import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ExitKidModeForm,
  UnlockKidModeForm,
} from "@/components/child-session/kid-mode-forms";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";

export const dynamic = "force-dynamic";

export default async function KidModePage() {
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    redirect("/family/setup");
  }

  const children = context.members.filter((member) => member.role === "child");

  if (context.currentMember.role === "child") {
    return (
      <section className="grid gap-5">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <StatusPill tone="success">Kid Mode active</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
            {context.currentMember.displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            This profile can view kid-friendly pages and submit its own chores.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href="/my-today"
            >
              Open My Today
            </Link>
            <ExitKidModeForm />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="info">Parent account</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Kid Mode
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Unlock a parent-managed child profile without giving access to parent
          controls.
        </p>
      </div>

      <UnlockKidModeForm
        childrenProfiles={children}
        familyId={context.family.id}
      />
    </section>
  );
}

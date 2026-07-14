import Link from "next/link";
import { redirect } from "next/navigation";
import { AddChildMemberForm } from "@/components/family/family-member-form";
import { FamilyMemberList } from "@/components/family/family-member-list";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";

export const dynamic = "force-dynamic";

export default async function FamilySettingsPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  if (context.currentMember?.role !== "parent") {
    redirect("/dashboard");
  }

  const activeChildren = context.members.filter(
    (member) =>
      member.role === "child" && member.lifecycleStatus === "active",
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
              Family settings
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {context.family.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Manage parent-created child profiles, ability notes, preferences,
              and sick or rest status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="success">{activeChildren.length} active kids</StatusPill>
            <Link
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <FamilyMemberList familyId={context.family.id} members={context.members} />
      <AddChildMemberForm familyId={context.family.id} />
    </section>
  );
}

import { redirect } from "next/navigation";
import { ReviewQueue } from "@/components/reviews/review-queue";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getPendingReviewItems } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  if (context.currentMember?.role !== "parent") {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="warning">Parent only</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Reviews need a parent
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ask a parent to approve or send back submitted chores.
        </p>
      </section>
    );
  }

  const items = await getPendingReviewItems(context.family.id);

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill tone="info">Parent review</StatusPill>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              Approvals
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Review submitted chores, award points, or send kind feedback for a
              resubmission.
            </p>
          </div>
          <div className="rounded-md border border-[var(--line)] px-3 py-2 text-sm">
            <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
              Pending
            </p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {items.length}
            </p>
          </div>
        </div>
      </div>

      <ReviewQueue familyId={context.family.id} items={items} />
    </section>
  );
}

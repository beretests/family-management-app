import Link from "next/link";
import { FamilyLeaderboard } from "@/components/leaderboard/family-leaderboard";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getFamilyLeaderboard } from "@/features/leaderboard/queries";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="warning">Setup needed</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Create your family workspace
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The leaderboard is available after family setup.
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

  const entries = await getFamilyLeaderboard({
    familyId: context.family.id,
    members: context.members,
  });

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Encouraging</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Leaderboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          A family-private progress board for celebrating consistency and
          effort. It avoids public sharing and does not rank kids on raw points
          alone.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/rewards"
          >
            Open rewards
          </Link>
        </div>
      </div>

      <FamilyLeaderboard entries={entries} />
    </section>
  );
}

import Link from "next/link";
import {
  CreateRewardForm,
  RedemptionHistory,
  RedemptionReviewList,
  RewardCatalogManager,
  RewardRequestCatalog,
} from "@/components/rewards/reward-forms";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getRewardPageData } from "@/features/rewards/queries";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="warning">Setup needed</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Create your family workspace
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Rewards are available after family setup.
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

  const data = await getRewardPageData({
    familyId: context.family.id,
    members: context.members,
  });
  const isParent = context.currentMember.role === "parent";
  const isChild = context.currentMember.role === "child";
  const currentBalance =
    data.balances.find(
      (balance) => balance.memberId === context.currentMember?.id,
    )?.pointsBalance ?? 0;

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Family private</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Rewards
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Parents manage a non-monetary reward catalog. Kids can request active
          rewards when they have enough approved points.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href="/leaderboard"
          >
            View leaderboard
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Active rewards"
          value={data.catalog.filter((reward) => reward.active).length}
        />
        <MetricCard
          label="Pending requests"
          value={
            data.redemptions.filter(
              (redemption) => redemption.status === "requested",
            ).length
          }
        />
        <MetricCard label="Your balance" value={currentBalance} />
      </div>

      {isParent ? (
        <>
          <CreateRewardForm familyId={context.family.id} />
          <RewardCatalogManager
            catalog={data.catalog}
            familyId={context.family.id}
          />
          <RedemptionReviewList
            familyId={context.family.id}
            redemptions={data.redemptions}
          />
        </>
      ) : null}

      {isChild ? (
        <RewardRequestCatalog
          balances={data.balances}
          catalog={data.catalog}
          currentMemberId={context.currentMember.id}
          familyId={context.family.id}
        />
      ) : null}

      <RedemptionHistory redemptions={data.redemptions} />
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--accent-strong)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </article>
  );
}

"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import {
  approveRewardRedemption,
  createReward,
  rejectRewardRedemption,
  requestRewardRedemption,
  type RewardActionState,
  updateReward,
} from "@/features/rewards/actions";
import type {
  RewardBalance,
  RewardCatalogItem,
  RewardRedemption,
} from "@/features/rewards/types";

const initialState: RewardActionState = {};

export function CreateRewardForm({ familyId }: { familyId: string }) {
  const [state, formAction] = useActionState(createReward, initialState);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Add reward
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Keep rewards non-monetary by default: extra story time, choosing dinner,
        a park trip, or a family movie.
      </p>
      <RewardFields
        action={formAction}
        familyId={familyId}
        state={state}
        submitLabel="Create reward"
      />
    </section>
  );
}

export function RewardCatalogManager({
  catalog,
  familyId,
}: {
  catalog: RewardCatalogItem[];
  familyId: string;
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Reward catalog
      </h2>
      <div className="mt-4 grid gap-3">
        {catalog.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            Add a few small family rewards before kids start redeeming points.
          </p>
        ) : null}
        {catalog.map((reward) => (
          <EditRewardForm familyId={familyId} key={reward.id} reward={reward} />
        ))}
      </div>
    </section>
  );
}

export function RewardRequestCatalog({
  balances,
  catalog,
  currentMemberId,
  familyId,
}: {
  balances: RewardBalance[];
  catalog: RewardCatalogItem[];
  currentMemberId: string;
  familyId: string;
}) {
  const balance =
    balances.find((item) => item.memberId === currentMemberId)?.pointsBalance ??
    0;
  const activeRewards = catalog.filter((reward) => reward.active);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Pick a reward
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Current balance: {balance} point{balance === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {activeRewards.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] md:col-span-2">
            No active rewards are available yet.
          </p>
        ) : null}
        {activeRewards.map((reward) => (
          <RewardRequestCard
            balance={balance}
            familyId={familyId}
            key={reward.id}
            reward={reward}
          />
        ))}
      </div>
    </section>
  );
}

export function RedemptionReviewList({
  familyId,
  redemptions,
}: {
  familyId: string;
  redemptions: RewardRedemption[];
}) {
  const pending = redemptions.filter(
    (redemption) => redemption.status === "requested",
  );

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Parent review
      </h2>
      <div className="mt-4 grid gap-3">
        {pending.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            No reward requests are waiting for review.
          </p>
        ) : null}
        {pending.map((redemption) => (
          <article
            className="rounded-md border border-[var(--line)] p-4"
            key={redemption.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {redemption.rewardTitle}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {redemption.requestedByName} requested this for{" "}
                  {redemption.pointsSpent} point
                  {redemption.pointsSpent === 1 ? "" : "s"}.
                </p>
                {redemption.note ? (
                  <p className="mt-2 whitespace-pre-line text-sm text-[var(--muted)]">
                    {redemption.note}
                  </p>
                ) : null}
              </div>
            </div>
            <RedemptionReviewActions
              familyId={familyId}
              redemptionId={redemption.id}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function RedemptionHistory({
  redemptions,
}: {
  redemptions: RewardRedemption[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        Reward history
      </h2>
      <div className="mt-4 grid gap-3">
        {redemptions.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            Reward requests will appear here.
          </p>
        ) : null}
        {redemptions.slice(0, 10).map((redemption) => (
          <article
            className="rounded-md border border-[var(--line)] p-4"
            key={redemption.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {redemption.rewardTitle}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {redemption.requestedByName} · {redemption.pointsSpent} point
                  {redemption.pointsSpent === 1 ? "" : "s"}
                </p>
              </div>
              <span className="w-fit rounded-md border border-[var(--line)] px-3 py-1 text-sm font-semibold capitalize text-[var(--foreground)]">
                {redemption.status}
              </span>
            </div>
            {redemption.note ? (
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--muted)]">
                {redemption.note}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function EditRewardForm({
  familyId,
  reward,
}: {
  familyId: string;
  reward: RewardCatalogItem;
}) {
  const [state, formAction] = useActionState(updateReward, initialState);

  return (
    <details className="rounded-md border border-[var(--line)] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              {reward.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {reward.pointsCost} point{reward.pointsCost === 1 ? "" : "s"} ·{" "}
              {reward.active ? "Active" : "Paused"}
            </p>
          </div>
        </div>
      </summary>
      <RewardFields
        action={formAction}
        familyId={familyId}
        reward={reward}
        state={state}
        submitLabel="Save reward"
      />
    </details>
  );
}

function RewardRequestCard({
  balance,
  familyId,
  reward,
}: {
  balance: number;
  familyId: string;
  reward: RewardCatalogItem;
}) {
  const [state, formAction] = useActionState(
    requestRewardRedemption,
    initialState,
  );
  const canAfford = balance >= reward.pointsCost;

  return (
    <article className="rounded-md border border-[var(--line)] p-4">
      <h3 className="font-semibold text-[var(--foreground)]">{reward.title}</h3>
      <p className="mt-1 text-sm font-semibold text-[var(--accent-strong)]">
        {reward.pointsCost} point{reward.pointsCost === 1 ? "" : "s"}
      </p>
      {reward.description ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{reward.description}</p>
      ) : null}
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="familyId" type="hidden" value={familyId} />
        <input name="rewardId" type="hidden" value={reward.id} />
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Note for parent
          <textarea
            className="min-h-20 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
            maxLength={300}
            name="note"
            placeholder="Optional"
          />
        </label>
        <ActionMessage error={state.error} success={state.success} />
        <SubmitButton disabled={!canAfford}>
          {canAfford ? "Request reward" : "Keep earning points"}
        </SubmitButton>
      </form>
    </article>
  );
}

function RedemptionReviewActions({
  familyId,
  redemptionId,
}: {
  familyId: string;
  redemptionId: string;
}) {
  const [approveState, approveAction] = useActionState(
    approveRewardRedemption,
    initialState,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectRewardRedemption,
    initialState,
  );

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <form
        action={approveAction}
        className="rounded-md border border-[var(--line)] p-4"
      >
        <input name="familyId" type="hidden" value={familyId} />
        <input name="redemptionId" type="hidden" value={redemptionId} />
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Approval note
          <textarea
            className="min-h-20 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
            maxLength={400}
            name="feedback"
            placeholder="Optional"
          />
        </label>
        <div className="mt-3">
          <ActionMessage
            error={approveState.error}
            success={approveState.success}
          />
        </div>
        <div className="mt-3">
          <SubmitButton>Approve reward</SubmitButton>
        </div>
      </form>

      <form
        action={rejectAction}
        className="rounded-md border border-[var(--line)] p-4"
      >
        <input name="familyId" type="hidden" value={familyId} />
        <input name="redemptionId" type="hidden" value={redemptionId} />
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Supportive feedback
          <textarea
            className="min-h-20 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal"
            maxLength={400}
            name="feedback"
            placeholder="Example: Let's save this for the weekend."
          />
        </label>
        <div className="mt-3">
          <ActionMessage
            error={rejectState.error}
            success={rejectState.success}
          />
        </div>
        <div className="mt-3">
          <SubmitButton tone="secondary">Decline request</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function RewardFields({
  action,
  familyId,
  reward,
  state,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  familyId: string;
  reward?: RewardCatalogItem;
  state: RewardActionState;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-4 grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      {reward ? (
        <input name="rewardId" type="hidden" value={reward.id} />
      ) : null}
      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Title
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={reward?.title ?? ""}
            maxLength={120}
            name="title"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Points
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={reward?.pointsCost ?? 50}
            max={10000}
            min={0}
            name="pointsCost"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Minimum age
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={reward?.minimumAge ?? ""}
            max={18}
            min={0}
            name="minimumAge"
            placeholder="Optional"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Maximum age
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            defaultValue={reward?.maximumAge ?? ""}
            max={18}
            min={0}
            name="maximumAge"
            placeholder="Optional"
            type="number"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Description
        <textarea
          className="min-h-24 rounded-md border border-[var(--line)] px-3 py-2 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={reward?.description ?? ""}
          maxLength={500}
          name="description"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
        <input
          className="size-4"
          defaultChecked={reward?.active ?? true}
          name="active"
          type="checkbox"
        />
        Active
      </label>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

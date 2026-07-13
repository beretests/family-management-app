"use server";

import { revalidatePath } from "next/cache";
import {
  createRewardSchema,
  requestRewardRedemptionSchema,
  reviewRewardRedemptionSchema,
  updateRewardSchema,
} from "@/features/rewards/schemas";
import { getFamilyContext } from "@/features/family/queries";
import { getPointsLedgerEntries } from "@/features/rewards/queries";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type RewardActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type RewardRow = {
  id: string;
  family_id: string;
  title: string;
  points_cost: number;
  minimum_age: number | null;
  maximum_age: number | null;
  active: boolean;
};

type RewardRedemptionReviewRow = {
  id: string;
  family_id: string;
  reward_id: string;
  requested_by_member_id: string;
  status: string;
  points_spent: number;
  note: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function readRewardForm(formData: FormData) {
  return {
    active: getBoolean(formData, "active"),
    description: getString(formData, "description"),
    familyId: getString(formData, "familyId"),
    maximumAge: getString(formData, "maximumAge"),
    minimumAge: getString(formData, "minimumAge"),
    pointsCost: getString(formData, "pointsCost"),
    title: getString(formData, "title"),
  };
}

async function insertAuditEvent({
  action,
  actorMemberId,
  familyId,
  supabase,
  target,
}: {
  action: string;
  actorMemberId: string;
  familyId: string;
  supabase: AppSupabaseClient;
  target: Record<string, unknown>;
}) {
  await supabase.from("audit_events").insert({
    action,
    actor_member_id: actorMemberId,
    family_id: familyId,
    metadata: target,
  });
}

async function getReward({
  familyId,
  rewardId,
  supabase,
}: {
  familyId: string;
  rewardId: string;
  supabase: AppSupabaseClient;
}) {
  const { data, error } = await supabase
    .from("reward_catalog")
    .select("id,family_id,title,points_cost,minimum_age,maximum_age,active")
    .eq("family_id", familyId)
    .eq("id", rewardId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Reward is not available.");
  }

  return data as RewardRow;
}

async function getRequestedRedemption({
  familyId,
  redemptionId,
  supabase,
}: {
  familyId: string;
  redemptionId: string;
  supabase: AppSupabaseClient;
}) {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select(
      "id,family_id,reward_id,requested_by_member_id,status,points_spent,note",
    )
    .eq("family_id", familyId)
    .eq("id", redemptionId)
    .eq("status", "requested")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Reward request is not available for review.");
  }

  return data as RewardRedemptionReviewRow;
}

async function getMemberBalance(familyId: string, memberId: string) {
  const entries = await getPointsLedgerEntries(familyId);

  return entries
    .filter((entry) => entry.memberId === memberId)
    .reduce((total, entry) => total + entry.pointsDelta, 0);
}

function isAgeEligible({
  ageYears,
  reward,
}: {
  ageYears: number | null;
  reward: Pick<RewardRow, "minimum_age" | "maximum_age">;
}) {
  if (ageYears === null) {
    return true;
  }

  if (reward.minimum_age !== null && ageYears < reward.minimum_age) {
    return false;
  }

  if (reward.maximum_age !== null && ageYears > reward.maximum_age) {
    return false;
  }

  return true;
}

function redemptionReviewNote({
  feedback,
  requestNote,
}: {
  feedback?: string;
  requestNote: string | null;
}) {
  if (!feedback) {
    return requestNote;
  }

  if (!requestNote) {
    return `Parent note: ${feedback}`;
  }

  return `Request note: ${requestNote}\nParent note: ${feedback}`;
}

export async function createReward(
  _previousState: RewardActionState,
  formData: FormData,
): Promise<RewardActionState> {
  const parsed = createRewardSchema.safeParse(readRewardForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase.from("reward_catalog").insert({
      active: parsed.data.active,
      created_by_member_id: parent.memberId,
      description: parsed.data.description ?? null,
      family_id: parent.familyId,
      maximum_age: parsed.data.maximumAge ?? null,
      minimum_age: parsed.data.minimumAge ?? null,
      points_cost: parsed.data.pointsCost,
      requires_parent_approval: true,
      title: parsed.data.title,
    });

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "reward_catalog.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { title: parsed.data.title },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: "Reward added." };
}

export async function updateReward(
  _previousState: RewardActionState,
  formData: FormData,
): Promise<RewardActionState> {
  const parsed = updateRewardSchema.safeParse({
    ...readRewardForm(formData),
    rewardId: getString(formData, "rewardId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase
      .from("reward_catalog")
      .update({
        active: parsed.data.active,
        description: parsed.data.description ?? null,
        maximum_age: parsed.data.maximumAge ?? null,
        minimum_age: parsed.data.minimumAge ?? null,
        points_cost: parsed.data.pointsCost,
        title: parsed.data.title,
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.rewardId);

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "reward_catalog.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { rewardId: parsed.data.rewardId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: "Reward saved." };
}

export async function requestRewardRedemption(
  _previousState: RewardActionState,
  formData: FormData,
): Promise<RewardActionState> {
  const parsed = requestRewardRedemptionSchema.safeParse({
    familyId: getString(formData, "familyId"),
    note: getString(formData, "note"),
    rewardId: getString(formData, "rewardId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const context = await getFamilyContext();

    if (
      !context.family ||
      !context.currentMember ||
      context.family.id !== parsed.data.familyId
    ) {
      throw new Error("Reward is not available for this family.");
    }

    if (context.currentMember.role !== "child") {
      throw new Error("Only child profiles can request rewards.");
    }

    const reward = await getReward({
      familyId: context.family.id,
      rewardId: parsed.data.rewardId,
      supabase,
    });

    if (!reward.active) {
      throw new Error("This reward is not active.");
    }

    if (
      !isAgeEligible({
        ageYears: context.currentMember.ageYears,
        reward,
      })
    ) {
      throw new Error("This reward is outside your age range.");
    }

    const balance = await getMemberBalance(
      context.family.id,
      context.currentMember.id,
    );

    if (balance < reward.points_cost) {
      throw new Error("Not enough points for this reward yet.");
    }

    const { error } = await supabase.from("reward_redemptions").insert({
      family_id: context.family.id,
      note: parsed.data.note ?? null,
      points_spent: reward.points_cost,
      requested_by_member_id: context.currentMember.id,
      reward_id: reward.id,
      status: "requested",
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: "Reward request sent for parent review." };
}

export async function approveRewardRedemption(
  _previousState: RewardActionState,
  formData: FormData,
): Promise<RewardActionState> {
  const parsed = reviewRewardRedemptionSchema.safeParse({
    familyId: getString(formData, "familyId"),
    feedback: getString(formData, "feedback"),
    redemptionId: getString(formData, "redemptionId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const redemption = await getRequestedRedemption({
      familyId: parent.familyId,
      redemptionId: parsed.data.redemptionId,
      supabase,
    });
    const balance = await getMemberBalance(
      parent.familyId,
      redemption.requested_by_member_id,
    );

    if (balance < redemption.points_spent) {
      throw new Error("This child no longer has enough points.");
    }

    const reviewNote = redemptionReviewNote({
      feedback: parsed.data.feedback,
      requestNote: redemption.note,
    });
    const { data: updatedRows, error: updateError } = await supabase
      .from("reward_redemptions")
      .update({
        note: reviewNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by_member_id: parent.memberId,
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", parent.familyId)
      .eq("id", redemption.id)
      .eq("status", "requested")
      .select("id");

    if (updateError) {
      return { error: updateError.message };
    }

    if (!updatedRows?.length) {
      throw new Error("This reward request has already been reviewed.");
    }

    const { error: ledgerError } = await supabase.from("points_ledger").insert({
      created_by_member_id: parent.memberId,
      family_id: parent.familyId,
      member_id: redemption.requested_by_member_id,
      note: `Reward approved for ${redemption.points_spent} point${
        redemption.points_spent === 1 ? "" : "s"
      }.`,
      points_delta: -redemption.points_spent,
      reward_redemption_id: redemption.id,
      source: "reward_redemption",
    });

    if (ledgerError) {
      return { error: ledgerError.message };
    }

    await insertAuditEvent({
      action: "reward_redemption.approved",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        pointsSpent: redemption.points_spent,
        redemptionId: redemption.id,
        requestedByMemberId: redemption.requested_by_member_id,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/rewards");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  return { success: "Reward approved and points deducted." };
}

export async function rejectRewardRedemption(
  _previousState: RewardActionState,
  formData: FormData,
): Promise<RewardActionState> {
  const parsed = reviewRewardRedemptionSchema.safeParse({
    familyId: getString(formData, "familyId"),
    feedback: getString(formData, "feedback"),
    redemptionId: getString(formData, "redemptionId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const redemption = await getRequestedRedemption({
      familyId: parent.familyId,
      redemptionId: parsed.data.redemptionId,
      supabase,
    });
    const { data: updatedRows, error: updateError } = await supabase
      .from("reward_redemptions")
      .update({
        note: redemptionReviewNote({
          feedback: parsed.data.feedback,
          requestNote: redemption.note,
        }),
        reviewed_at: new Date().toISOString(),
        reviewed_by_member_id: parent.memberId,
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", parent.familyId)
      .eq("id", redemption.id)
      .eq("status", "requested")
      .select("id");

    if (updateError) {
      return { error: updateError.message };
    }

    if (!updatedRows?.length) {
      throw new Error("This reward request has already been reviewed.");
    }

    await insertAuditEvent({
      action: "reward_redemption.rejected",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        redemptionId: redemption.id,
        requestedByMemberId: redemption.requested_by_member_id,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: "Reward request declined." };
}

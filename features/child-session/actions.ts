"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unlockKidModeSchema } from "@/features/child-session/schemas";
import {
  buildChildSessionPayload,
  clearChildSessionPayload,
  setChildSessionPayload,
} from "@/lib/auth/child-session";
import { verifyChildPin } from "@/lib/auth/pin";
import {
  getAuthenticatedProfileId,
  requireParentContext,
} from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type ChildSessionActionState = {
  error?: string;
  success?: string;
};

const maxFailedAttempts = 5;
const lockoutMinutes = 15;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function unlockKidMode(
  _previousState: ChildSessionActionState,
  formData: FormData,
): Promise<ChildSessionActionState> {
  const parsed = unlockKidModeSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
    pin: getString(formData, "pin"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const parentProfileId = await getAuthenticatedProfileId(supabase);
    const { data: child, error: childError } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .eq("role", "child")
      .eq("lifecycle_status", "active")
      .maybeSingle();

    if (childError) {
      return { error: childError.message };
    }

    if (!child) {
      return { error: "Active child profile not found." };
    }

    const { data: credential, error: credentialError } = await supabase
      .from("family_member_pin_credentials")
      .select("pin_hash,failed_attempts,locked_until")
      .eq("family_id", parent.familyId)
      .eq("member_id", parsed.data.memberId)
      .maybeSingle();

    if (credentialError) {
      return { error: credentialError.message };
    }

    if (!credential?.pin_hash) {
      return { error: "Set a Kid Mode PIN for this child first." };
    }

    if (
      credential.locked_until &&
      new Date(credential.locked_until as string) > new Date()
    ) {
      return {
        error: "Too many PIN attempts. Try again later or reset the PIN.",
      };
    }

    const pinMatches = await verifyChildPin(
      parsed.data.pin,
      credential.pin_hash as string,
    );

    if (!pinMatches) {
      const failedAttempts = Number(credential.failed_attempts ?? 0) + 1;
      const lockedUntil =
        failedAttempts >= maxFailedAttempts
          ? new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString()
          : null;

      await supabase
        .from("family_member_pin_credentials")
        .update({
          failed_attempts: failedAttempts,
          locked_until: lockedUntil,
        })
        .eq("family_id", parent.familyId)
        .eq("member_id", parsed.data.memberId);

      return {
        error: lockedUntil
          ? "Too many PIN attempts. Try again later or reset the PIN."
          : "PIN did not match.",
      };
    }

    const { error: resetError } = await supabase
      .from("family_member_pin_credentials")
      .update({
        failed_attempts: 0,
        locked_until: null,
      })
      .eq("family_id", parent.familyId)
      .eq("member_id", parsed.data.memberId);

    if (resetError) {
      return { error: resetError.message };
    }

    await setChildSessionPayload(
      buildChildSessionPayload({
        familyId: parent.familyId,
        memberId: parsed.data.memberId,
        parentMemberId: parent.memberId,
        parentProfileId,
      }),
    );

    await supabase.from("audit_events").insert({
      action: "kid_mode.unlocked",
      actor_member_id: parent.memberId,
      family_id: parent.familyId,
      metadata: { memberId: parsed.data.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/");
  redirect("/my-today");
}

export async function exitKidMode() {
  await clearChildSessionPayload();
  revalidatePath("/");
  redirect("/dashboard");
}

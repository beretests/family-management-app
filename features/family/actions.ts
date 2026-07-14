"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  childPinSchema,
  childMemberSchema,
  deactivateChildMemberSchema,
  familySetupSchema,
  memberStatusSchema,
  updateChildMemberSchema,
} from "@/features/family/schemas";
import { hashChildPin } from "@/lib/auth/pin";
import {
  getAuthenticatedProfileId,
  requireParentContext,
} from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type FamilyActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function insertAuditEvent({
  action,
  actorMemberId,
  familyId,
  target,
}: {
  action: string;
  actorMemberId: string;
  familyId: string;
  target: Record<string, unknown>;
}) {
  const supabase = await createClient();

  await supabase.from("audit_events").insert({
    action,
    actor_member_id: actorMemberId,
    family_id: familyId,
    metadata: target,
  });
}

export async function createFamily(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = familySetupSchema.safeParse({
    familyName: getString(formData, "familyName"),
    parentDisplayName: getString(formData, "parentDisplayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const profileId = await getAuthenticatedProfileId(supabase);
    const familyId = crypto.randomUUID();
    const parentMemberId = crypto.randomUUID();

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: profileId,
      display_name: parsed.data.parentDisplayName,
    });

    if (profileError) {
      return { error: profileError.message };
    }

    const { error: familyError } = await supabase.from("families").insert({
      id: familyId,
      name: parsed.data.familyName,
      created_by_profile_id: profileId,
    });

    if (familyError) {
      return { error: familyError.message };
    }

    const { error: memberError } = await supabase.from("family_members").insert({
      id: parentMemberId,
      family_id: familyId,
      profile_id: profileId,
      display_name: parsed.data.parentDisplayName,
      role: "parent",
      ability_level: 5,
      color: "#047857",
    });

    if (memberError) {
      return { error: memberError.message };
    }

    await insertAuditEvent({
      action: "family.created",
      actorMemberId: parentMemberId,
      familyId,
      target: { familyName: parsed.data.familyName },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/settings/family");
}

export async function createChildMember(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = childMemberSchema.safeParse({
    familyId: getString(formData, "familyId"),
    displayName: getString(formData, "displayName"),
    ageYears: getString(formData, "ageYears"),
    abilityLevel: getString(formData, "abilityLevel"),
    color: getString(formData, "color"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const memberId = crypto.randomUUID();
    const { error: memberError } = await supabase.from("family_members").insert({
      id: memberId,
      family_id: parent.familyId,
      display_name: parsed.data.displayName,
      role: "child",
      age_years: parsed.data.ageYears,
      ability_level: parsed.data.abilityLevel,
      color: parsed.data.color,
    });

    if (memberError) {
      return { error: memberError.message };
    }

    if (parsed.data.notes) {
      const { error: preferenceError } = await supabase
        .from("family_member_preferences")
        .insert({
          family_id: parent.familyId,
          member_id: memberId,
          notes: parsed.data.notes,
        });

      if (preferenceError) {
        return { error: preferenceError.message };
      }
    }

    await supabase.from("family_member_statuses").insert({
      family_id: parent.familyId,
      member_id: memberId,
      status: "normal",
      requested_by_member_id: parent.memberId,
      approved_by_member_id: parent.memberId,
    });

    await insertAuditEvent({
      action: "family_member.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId, role: "child" },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: `${parsed.data.displayName} was added.` };
}

export async function updateChildMember(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = updateChildMemberSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
    displayName: getString(formData, "displayName"),
    ageYears: getString(formData, "ageYears"),
    abilityLevel: getString(formData, "abilityLevel"),
    color: getString(formData, "color"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data: member, error: memberLookupError } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .eq("role", "child")
      .maybeSingle();

    if (memberLookupError) {
      return { error: memberLookupError.message };
    }

    if (!member) {
      return { error: "Child profile not found." };
    }

    const { error: updateError } = await supabase
      .from("family_members")
      .update({
        display_name: parsed.data.displayName,
        age_years: parsed.data.ageYears,
        ability_level: parsed.data.abilityLevel,
        color: parsed.data.color,
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId);

    if (updateError) {
      return { error: updateError.message };
    }

    const { error: preferenceError } = await supabase
      .from("family_member_preferences")
      .upsert(
        {
          family_id: parent.familyId,
          member_id: parsed.data.memberId,
          notes: parsed.data.notes ?? null,
        },
        { onConflict: "member_id" },
      );

    if (preferenceError) {
      return { error: preferenceError.message };
    }

    await insertAuditEvent({
      action: "family_member.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parsed.data.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: `${parsed.data.displayName} was updated.` };
}

export async function setChildPin(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = childPinSchema.safeParse({
    confirmPin: getString(formData, "confirmPin"),
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
    const { data: member, error: memberLookupError } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .eq("role", "child")
      .eq("lifecycle_status", "active")
      .maybeSingle();

    if (memberLookupError) {
      return { error: memberLookupError.message };
    }

    if (!member) {
      return { error: "Active child profile not found." };
    }

    const { error: credentialError } = await supabase
      .from("family_member_pin_credentials")
      .upsert(
        {
          failed_attempts: 0,
          family_id: parent.familyId,
          locked_until: null,
          member_id: parsed.data.memberId,
          pin_hash: await hashChildPin(parsed.data.pin),
          updated_by_member_id: parent.memberId,
        },
        { onConflict: "member_id" },
      );

    if (credentialError) {
      return { error: credentialError.message };
    }

    await insertAuditEvent({
      action: "kid_mode.pin_set",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parsed.data.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/settings/family");
  revalidatePath("/kid-mode");
  return { success: "Kid Mode PIN was saved." };
}

export async function deactivateChildMember(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = deactivateChildMemberSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase
      .from("family_members")
      .update({
        lifecycle_status: "inactive",
        deactivated_at: new Date().toISOString(),
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .eq("role", "child");

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "family_member.deactivated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parsed.data.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: "Child profile was deactivated." };
}

export async function setMemberStatus(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = memberStatusSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
    status: getString(formData, "status"),
    note: getString(formData, "note"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data: member, error: memberLookupError } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .eq("role", "child")
      .maybeSingle();

    if (memberLookupError) {
      return { error: memberLookupError.message };
    }

    if (!member) {
      return { error: "Child profile not found." };
    }

    const { error: statusError } = await supabase.from("family_member_statuses").insert({
      family_id: parent.familyId,
      member_id: parsed.data.memberId,
      status: parsed.data.status,
      note: parsed.data.note ?? null,
      requested_by_member_id: parent.memberId,
      approved_by_member_id: parent.memberId,
    });

    if (statusError) {
      return { error: statusError.message };
    }

    await insertAuditEvent({
      action: "family_member.status_changed",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parsed.data.memberId, status: parsed.data.status },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: "Status updated." };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  acceptFamilyInvitationSchema,
  adultInviteSchema,
  childPinSchema,
  childMemberSchema,
  deactivateAdultMemberSchema,
  deactivateChildMemberSchema,
  familySetupSchema,
  memberStatusSchema,
  revokeFamilyInvitationSchema,
  updateParentProfileSchema,
  updateChildMemberSchema,
} from "@/features/family/schemas";
import { hashChildPin } from "@/lib/auth/pin";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { birthMonthToDate } from "@/lib/dates/age";
import {
  getAuthenticatedProfileId,
  requireParentContext,
} from "@/lib/permissions/family";
import { createAdminClient } from "@/lib/supabase/admin";
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function invitationAcceptPath(invitationId: string) {
  return `/family/invite/accept?invite=${encodeURIComponent(invitationId)}`;
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
    birthMonth: getString(formData, "birthMonth"),
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
      birthdate: birthMonthToDate({
        month: Number(parsed.data.birthMonth.slice(5, 7)),
        year: Number(parsed.data.birthMonth.slice(0, 4)),
      }),
      age_years: null,
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
    birthMonth: getString(formData, "birthMonth"),
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
        birthdate: birthMonthToDate({
          month: Number(parsed.data.birthMonth.slice(5, 7)),
          year: Number(parsed.data.birthMonth.slice(0, 4)),
        }),
        age_years: null,
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

export async function inviteAdultMember(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = adultInviteSchema.safeParse({
    familyId: getString(formData, "familyId"),
    displayName: getString(formData, "displayName"),
    email: getString(formData, "email"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();
  const memberId = crypto.randomUUID();
  const invitationId = crypto.randomUUID();
  const email = normalizeEmail(parsed.data.email);

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data: existingInvitation, error: existingInvitationError } =
      await supabase
        .from("family_invitations")
        .select("id")
        .eq("family_id", parent.familyId)
        .eq("email_normalized", email)
        .eq("status", "pending")
        .maybeSingle();

    if (existingInvitationError) {
      return { error: existingInvitationError.message };
    }

    if (existingInvitation) {
      return { error: "This email already has a pending family invite." };
    }

    const { error: memberError } = await supabase.from("family_members").insert({
      id: memberId,
      family_id: parent.familyId,
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      ability_level: 5,
      color: parsed.data.role === "parent" ? "#047857" : "#2563eb",
      lifecycle_status: "inactive",
    });

    if (memberError) {
      return { error: memberError.message };
    }

    const { error: invitationError } = await supabase
      .from("family_invitations")
      .insert({
        id: invitationId,
        family_id: parent.familyId,
        member_id: memberId,
        email_normalized: email,
        role: parsed.data.role,
        invited_by_member_id: parent.memberId,
      });

    if (invitationError) {
      await supabase
        .from("family_members")
        .update({
          lifecycle_status: "inactive",
          deactivated_at: new Date().toISOString(),
        })
        .eq("family_id", parent.familyId)
        .eq("id", memberId);
      return { error: invitationError.message };
    }

    try {
      const admin = createAdminClient();
      const acceptPath = invitationAcceptPath(invitationId);
      const redirectTo = getAuthCallbackUrl(
        `/callback?next=${encodeURIComponent(acceptPath)}`,
      );
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo },
      );

      if (inviteError) {
        throw inviteError;
      }
    } catch (error) {
      await supabase
        .from("family_invitations")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("family_id", parent.familyId)
        .eq("id", invitationId);
      await supabase
        .from("family_members")
        .update({
          lifecycle_status: "inactive",
          deactivated_at: new Date().toISOString(),
        })
        .eq("family_id", parent.familyId)
        .eq("id", memberId);

      return {
        error: `Invite email could not be sent: ${errorMessage(error)}`,
      };
    }

    await insertAuditEvent({
      action: "family_invitation.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { invitationId, memberId, role: parsed.data.role },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/settings/family");
  return { success: `Invite sent to ${email}.` };
}

export async function acceptFamilyInvitation(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = acceptFamilyInvitationSchema.safeParse({
    invitationId: getString(formData, "invitationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { error: "Sign in with the invited email address first." };
    }

    const user = userData.user;
    const userEmail = normalizeEmail(user.email ?? "");

    if (!userEmail) {
      return { error: "Your signed-in account does not have an email address." };
    }

    const admin = createAdminClient();
    const { data: invitation, error: invitationError } = await admin
      .from("family_invitations")
      .select(
        "id,family_id,member_id,email_normalized,role,status,invited_by_member_id,expires_at",
      )
      .eq("id", parsed.data.invitationId)
      .maybeSingle();

    if (invitationError) {
      return { error: invitationError.message };
    }

    if (!invitation) {
      return { error: "Family invite not found." };
    }

    if (invitation.status !== "pending") {
      return { error: "This family invite is no longer pending." };
    }

    if (new Date(invitation.expires_at as string).getTime() < Date.now()) {
      await admin
        .from("family_invitations")
        .update({ status: "expired" })
        .eq("id", parsed.data.invitationId);
      return { error: "This family invite has expired." };
    }

    if (normalizeEmail(invitation.email_normalized as string) !== userEmail) {
      return {
        error: "This invite belongs to a different email address.",
      };
    }

    const displayName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : userEmail.split("@")[0] || "Family member";

    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
    });

    if (profileError) {
      return { error: profileError.message };
    }

    const { error: memberError } = await admin
      .from("family_members")
      .update({
        profile_id: user.id,
        lifecycle_status: "active",
        deactivated_at: null,
      })
      .eq("family_id", invitation.family_id as string)
      .eq("id", invitation.member_id as string);

    if (memberError) {
      return { error: memberError.message };
    }

    const { error: linkError } = await admin
      .from("family_member_auth_links")
      .upsert(
        {
          family_id: invitation.family_id as string,
          member_id: invitation.member_id as string,
          profile_id: user.id,
          created_by_member_id:
            (invitation.invited_by_member_id as string | null) ?? null,
          revoked_at: null,
        },
        { onConflict: "family_id,member_id,profile_id" },
      );

    if (linkError) {
      return { error: linkError.message };
    }

    const { error: updateInvitationError } = await admin
      .from("family_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by_profile_id: user.id,
      })
      .eq("id", parsed.data.invitationId);

    if (updateInvitationError) {
      return { error: updateInvitationError.message };
    }

    await admin.from("audit_events").insert({
      action: "family_invitation.accepted",
      actor_member_id: invitation.member_id as string,
      family_id: invitation.family_id as string,
      metadata: {
        invitationId: parsed.data.invitationId,
        role: invitation.role,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  redirect("/dashboard");
}

export async function revokeFamilyInvitation(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = revokeFamilyInvitationSchema.safeParse({
    familyId: getString(formData, "familyId"),
    invitationId: getString(formData, "invitationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data: invitation, error: invitationError } = await supabase
      .from("family_invitations")
      .select("id,member_id,status")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.invitationId)
      .maybeSingle();

    if (invitationError) {
      return { error: invitationError.message };
    }

    if (!invitation || invitation.status !== "pending") {
      return { error: "Pending invitation not found." };
    }

    const revokedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("family_invitations")
      .update({ status: "revoked", revoked_at: revokedAt })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.invitationId);

    if (updateError) {
      return { error: updateError.message };
    }

    await supabase
      .from("family_members")
      .update({ lifecycle_status: "inactive", deactivated_at: revokedAt })
      .eq("family_id", parent.familyId)
      .eq("id", invitation.member_id as string)
      .is("profile_id", null);

    await insertAuditEvent({
      action: "family_invitation.revoked",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { invitationId: parsed.data.invitationId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/settings/family");
  return { success: "Invite revoked." };
}

export async function deactivateAdultMember(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = deactivateAdultMemberSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);

    if (parsed.data.memberId === parent.memberId) {
      return { error: "You cannot deactivate your own profile." };
    }

    const { data: targetMember, error: targetError } = await supabase
      .from("family_members")
      .select("id,role,lifecycle_status")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId)
      .in("role", ["parent", "caregiver"])
      .maybeSingle();

    if (targetError) {
      return { error: targetError.message };
    }

    if (!targetMember) {
      return { error: "Adult family member not found." };
    }

    if (targetMember.role === "parent") {
      const { count, error: countError } = await supabase
        .from("family_members")
        .select("id", { count: "exact", head: true })
        .eq("family_id", parent.familyId)
        .eq("role", "parent")
        .eq("lifecycle_status", "active")
        .not("profile_id", "is", null);

      if (countError) {
        return { error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return {
          error: "A family must keep at least one active accepted parent.",
        };
      }
    }

    const deactivatedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("family_members")
      .update({
        lifecycle_status: "inactive",
        deactivated_at: deactivatedAt,
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.memberId);

    if (updateError) {
      return { error: updateError.message };
    }

    await supabase
      .from("family_member_auth_links")
      .update({ revoked_at: deactivatedAt })
      .eq("family_id", parent.familyId)
      .eq("member_id", parsed.data.memberId)
      .is("revoked_at", null);

    await insertAuditEvent({
      action: "family_member.adult_deactivated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parsed.data.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: "Adult family member was deactivated." };
}

export async function updateParentProfile(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const parsed = updateParentProfileSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
    displayName: getString(formData, "displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);

    if (parsed.data.memberId !== parent.memberId) {
      return { error: "You can edit only your own parent profile." };
    }

    const { error: memberError } = await supabase
      .from("family_members")
      .update({
        display_name: parsed.data.displayName,
      })
      .eq("family_id", parent.familyId)
      .eq("id", parent.memberId)
      .eq("role", "parent");

    if (memberError) {
      return { error: memberError.message };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
      })
      .eq("id", parent.profileId);

    if (profileError) {
      return { error: profileError.message };
    }

    await insertAuditEvent({
      action: "parent_profile.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      target: { memberId: parent.memberId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/family");
  return { success: "Parent profile updated." };
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

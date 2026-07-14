import type { SupabaseClient } from "@supabase/supabase-js";
import { getChildSessionPayload } from "@/lib/auth/child-session";

export type ParentContext = {
  profileId: string;
  memberId: string;
  familyId: string;
};

export type ChildSessionContext = {
  familyId: string;
  memberId: string;
  parentMemberId: string;
  parentProfileId: string;
};

export async function getAuthenticatedProfileId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new Error("You must be signed in.");
  }

  return data.claims.sub;
}

export async function getVerifiedChildSessionContext(
  supabase: SupabaseClient,
  familyId?: string,
): Promise<ChildSessionContext | null> {
  const session = await getChildSessionPayload();

  if (!session || (familyId && session.familyId !== familyId)) {
    return null;
  }

  const profileId = await getAuthenticatedProfileId(supabase);

  if (session.parentProfileId !== profileId) {
    return null;
  }

  const { data: parent, error: parentError } = await supabase
    .from("family_members")
    .select("id,family_id")
    .eq("family_id", session.familyId)
    .eq("id", session.parentMemberId)
    .eq("profile_id", profileId)
    .eq("role", "parent")
    .eq("lifecycle_status", "active")
    .maybeSingle();

  if (parentError) {
    throw new Error(parentError.message);
  }

  if (!parent?.id) {
    return null;
  }

  const { data: child, error: childError } = await supabase
    .from("family_members")
    .select("id,family_id")
    .eq("family_id", session.familyId)
    .eq("id", session.memberId)
    .eq("role", "child")
    .eq("lifecycle_status", "active")
    .maybeSingle();

  if (childError) {
    throw new Error(childError.message);
  }

  if (!child?.id) {
    return null;
  }

  return {
    familyId: child.family_id as string,
    memberId: child.id as string,
    parentMemberId: parent.id as string,
    parentProfileId: profileId,
  };
}

export async function getCurrentActorMemberIds(
  supabase: SupabaseClient,
  familyId: string,
) {
  const { data, error } = await supabase.rpc("current_user_member_ids", {
    p_family_id: familyId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const memberIds = Array.isArray(data)
    ? data.filter((id): id is string => typeof id === "string")
    : [];
  const childSession = await getVerifiedChildSessionContext(supabase, familyId);

  if (childSession && !memberIds.includes(childSession.memberId)) {
    return [childSession.memberId, ...memberIds];
  }

  return memberIds;
}

export async function requireParentContext(
  supabase: SupabaseClient,
  familyId: string,
): Promise<ParentContext> {
  const profileId = await getAuthenticatedProfileId(supabase);
  const { data, error } = await supabase
    .from("family_members")
    .select("id,family_id")
    .eq("family_id", familyId)
    .eq("profile_id", profileId)
    .eq("role", "parent")
    .eq("lifecycle_status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Only active parents can manage family profiles.");
  }

  return {
    profileId,
    memberId: data.id as string,
    familyId: data.family_id as string,
  };
}

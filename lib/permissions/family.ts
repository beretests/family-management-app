import type { SupabaseClient } from "@supabase/supabase-js";

export type ParentContext = {
  profileId: string;
  memberId: string;
  familyId: string;
};

export async function getAuthenticatedProfileId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new Error("You must be signed in.");
  }

  return data.claims.sub;
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

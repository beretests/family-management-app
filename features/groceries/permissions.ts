import {
  getCurrentActorMemberIds,
  getVerifiedChildSessionContext,
} from "@/lib/permissions/family";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GrocerySupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type GroceryActor = {
  familyId: string;
  memberId: string;
  role: "parent" | "caregiver" | "child";
  writeClient: GrocerySupabaseClient;
};

export async function requireGroceryActor(
  supabase: GrocerySupabaseClient,
  familyId: string,
): Promise<GroceryActor> {
  const childSession = await getVerifiedChildSessionContext(supabase, familyId);

  if (childSession) {
    return {
      familyId,
      memberId: childSession.memberId,
      role: "child",
      writeClient: createAdminClient() as GrocerySupabaseClient,
    };
  }

  const memberIds = await getCurrentActorMemberIds(supabase, familyId);

  if (memberIds.length === 0) {
    throw new Error("You must be an active family member.");
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id,family_id,role")
    .eq("family_id", familyId)
    .eq("lifecycle_status", "active")
    .in("id", memberIds)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("You must be an active family member.");
  }

  return {
    familyId: data.family_id as string,
    memberId: data.id as string,
    role: data.role as GroceryActor["role"],
    writeClient: supabase,
  };
}

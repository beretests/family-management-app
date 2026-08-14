import {
  getCurrentActorMemberIds,
  getVerifiedChildSessionContext,
} from "@/lib/permissions/family";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ScheduleActor = {
  familyId: string;
  memberId: string;
  role: "parent" | "caregiver" | "child";
  writeClient: AppSupabaseClient;
};

export async function ensureMembersBelongToFamily({
  familyId,
  memberIds,
  supabase,
}: {
  familyId: string;
  memberIds: string[];
  supabase: AppSupabaseClient;
}) {
  if (memberIds.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .in("id", memberIds)
    .eq("lifecycle_status", "active")
    .limit(memberIds.length);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== memberIds.length) {
    throw new Error("Choose active family members.");
  }
}

export async function requireScheduleActor(
  supabase: AppSupabaseClient,
  familyId: string,
): Promise<ScheduleActor> {
  const childSession = await getVerifiedChildSessionContext(supabase, familyId);

  if (childSession) {
    return {
      familyId,
      memberId: childSession.memberId,
      role: "child",
      writeClient: createAdminClient() as AppSupabaseClient,
    };
  }

  const memberIds = await getCurrentActorMemberIds(supabase, familyId);

  if (memberIds.length === 0) {
    throw new Error("You must be an active family member.");
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id,role")
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
    familyId,
    memberId: data.id as string,
    role: data.role as ScheduleActor["role"],
    writeClient: supabase,
  };
}

export function enforceAttendeePermission(
  actor: ScheduleActor,
  memberIds: string[],
) {
  if (actor.role === "parent") {
    return;
  }

  if (memberIds.length !== 1 || memberIds[0] !== actor.memberId) {
    throw new Error(
      "Family members can add schedule events only for themselves.",
    );
  }
}

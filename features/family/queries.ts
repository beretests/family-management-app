import { createClient } from "@/lib/supabase/server";
import type {
  Family,
  FamilyContext,
  FamilyMember,
  FamilyMemberPreference,
  FamilyMemberStatus,
} from "@/features/family/types";
import { getAuthenticatedProfileId } from "@/lib/permissions/family";

type FamilyRow = {
  id: string;
  name: string;
  created_by_profile_id: string;
  deactivated_at: string | null;
};

type FamilyMemberRow = {
  id: string;
  family_id: string;
  profile_id: string | null;
  display_name: string;
  role: "parent" | "caregiver" | "child";
  birthdate: string | null;
  age_years: number | null;
  ability_level: number;
  color: string | null;
  lifecycle_status: "active" | "inactive";
  deactivated_at: string | null;
};

type PreferenceRow = {
  id: string;
  family_id: string;
  member_id: string;
  notes: string | null;
};

type StatusRow = {
  id: string;
  family_id: string;
  member_id: string;
  status: "normal" | "under_the_weather" | "sick" | "rest_day";
  note: string | null;
  starts_at: string;
  ends_at: string | null;
};

type MemberAuthLinkRow = {
  family_id: string;
  member_id: string;
};

function mapFamily(row: FamilyRow): Family {
  return {
    id: row.id,
    name: row.name,
    createdByProfileId: row.created_by_profile_id,
    deactivatedAt: row.deactivated_at,
  };
}

function mapMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    profileId: row.profile_id,
    displayName: row.display_name,
    role: row.role,
    birthdate: row.birthdate,
    ageYears: row.age_years,
    abilityLevel: row.ability_level,
    color: row.color,
    lifecycleStatus: row.lifecycle_status,
    deactivatedAt: row.deactivated_at,
  };
}

function mapPreference(row: PreferenceRow): FamilyMemberPreference {
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    notes: row.notes,
  };
}

function mapStatus(row: StatusRow): FamilyMemberStatus {
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    status: row.status,
    note: row.note,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export async function getFamilyContext(): Promise<FamilyContext> {
  const supabase = await createClient();
  const profileId = await getAuthenticatedProfileId(supabase);

  const { data: membershipRows, error: membershipError } = await supabase
    .from("family_members")
    .select(
      "id,family_id,profile_id,display_name,role,birthdate,age_years,ability_level,color,lifecycle_status,deactivated_at",
    )
    .eq("profile_id", profileId)
    .eq("lifecycle_status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  let currentMemberRow = membershipRows?.[0] as FamilyMemberRow | undefined;

  if (!currentMemberRow) {
    const { data: linkRows, error: linkError } = await supabase
      .from("family_member_auth_links")
      .select("family_id,member_id")
      .eq("profile_id", profileId)
      .is("revoked_at", null)
      .limit(1);

    if (linkError) {
      throw new Error(linkError.message);
    }

    const linkRow = linkRows?.[0] as MemberAuthLinkRow | undefined;

    if (linkRow) {
      const { data: linkedMemberRow, error: linkedMemberError } = await supabase
        .from("family_members")
        .select(
          "id,family_id,profile_id,display_name,role,birthdate,age_years,ability_level,color,lifecycle_status,deactivated_at",
        )
        .eq("family_id", linkRow.family_id)
        .eq("id", linkRow.member_id)
        .eq("lifecycle_status", "active")
        .maybeSingle();

      if (linkedMemberError) {
        throw new Error(linkedMemberError.message);
      }

      currentMemberRow = linkedMemberRow as FamilyMemberRow | undefined;
    }
  }

  if (!currentMemberRow) {
    return {
      family: null,
      currentMember: null,
      members: [],
    };
  }

  const familyId = currentMemberRow.family_id;
  const { data: familyRow, error: familyError } = await supabase
    .from("families")
    .select("id,name,created_by_profile_id,deactivated_at")
    .eq("id", familyId)
    .maybeSingle();

  if (familyError) {
    throw new Error(familyError.message);
  }

  if (!familyRow) {
    return {
      family: null,
      currentMember: mapMember(currentMemberRow),
      members: [],
    };
  }

  const { data: memberRows, error: membersError } = await supabase
    .from("family_members")
    .select(
      "id,family_id,profile_id,display_name,role,birthdate,age_years,ability_level,color,lifecycle_status,deactivated_at",
    )
    .eq("family_id", familyId)
    .order("role", { ascending: false })
    .order("age_years", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const { data: preferenceRows, error: preferencesError } = await supabase
    .from("family_member_preferences")
    .select("id,family_id,member_id,notes")
    .eq("family_id", familyId);

  if (preferencesError) {
    throw new Error(preferencesError.message);
  }

  const { data: statusRows, error: statusesError } = await supabase
    .from("family_member_statuses")
    .select("id,family_id,member_id,status,note,starts_at,ends_at")
    .eq("family_id", familyId)
    .order("starts_at", { ascending: false })
    .limit(100);

  if (statusesError) {
    throw new Error(statusesError.message);
  }

  const preferencesByMember = new Map(
    ((preferenceRows ?? []) as PreferenceRow[]).map((row) => [
      row.member_id,
      mapPreference(row),
    ]),
  );
  const statusesByMember = new Map<string, FamilyMemberStatus>();

  for (const row of (statusRows ?? []) as StatusRow[]) {
    if (!statusesByMember.has(row.member_id)) {
      statusesByMember.set(row.member_id, mapStatus(row));
    }
  }

  return {
    family: mapFamily(familyRow as FamilyRow),
    currentMember: mapMember(currentMemberRow),
    members: ((memberRows ?? []) as FamilyMemberRow[]).map((row) => ({
      ...mapMember(row),
      preferences: preferencesByMember.get(row.id) ?? null,
      currentStatus: statusesByMember.get(row.id) ?? null,
    })),
  };
}

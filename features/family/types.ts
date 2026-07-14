export type FamilyRole = "parent" | "caregiver" | "child";
export type FamilyMemberLifecycleStatus = "active" | "inactive";
export type FamilyInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";
export type FamilyMemberStatusState =
  | "normal"
  | "under_the_weather"
  | "sick"
  | "rest_day";

export type Family = {
  id: string;
  name: string;
  createdByProfileId: string;
  deactivatedAt: string | null;
};

export type FamilyMember = {
  id: string;
  familyId: string;
  profileId: string | null;
  displayName: string;
  role: FamilyRole;
  birthdate: string | null;
  ageYears: number | null;
  abilityLevel: number;
  color: string | null;
  lifecycleStatus: FamilyMemberLifecycleStatus;
  deactivatedAt: string | null;
};

export type FamilyMemberPreference = {
  id: string;
  familyId: string;
  memberId: string;
  notes: string | null;
};

export type FamilyMemberStatus = {
  id: string;
  familyId: string;
  memberId: string;
  status: FamilyMemberStatusState;
  note: string | null;
  startsAt: string;
  endsAt: string | null;
};

export type FamilyMemberWithDetails = FamilyMember & {
  preferences: FamilyMemberPreference | null;
  currentStatus: FamilyMemberStatus | null;
  hasKidModePin: boolean;
};

export type FamilyInvitation = {
  id: string;
  familyId: string;
  memberId: string;
  emailNormalized: string;
  role: "parent" | "caregiver";
  status: FamilyInvitationStatus;
  invitedByMemberId: string | null;
  acceptedByProfileId: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type FamilyContext = {
  family: Family | null;
  currentMember: FamilyMember | null;
  members: FamilyMemberWithDetails[];
};

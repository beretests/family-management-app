"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deactivateAdultMember,
  deactivateChildMember,
  disconnectChildEmailAccount,
  type FamilyActionState,
  inviteChildByEmail,
  revokeChildEmailInvitation,
  revokeFamilyInvitation,
  updateParentProfile,
} from "@/features/family/actions";
import type {
  ChildEmailInvitation,
  FamilyInvitation,
  FamilyMemberWithDetails,
} from "@/features/family/types";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { EditChildMemberForm } from "@/components/family/family-member-form";
import { KidModePinForm } from "@/components/family/kid-mode-pin-form";
import { MemberStatusForm } from "@/components/family/member-status-form";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";

const initialState: FamilyActionState = {};

const statusLabels = {
  normal: "Normal",
  under_the_weather: "Under the weather",
  sick: "Sick",
  rest_day: "Rest day",
};

export function FamilyMemberList({
  childInvitations,
  currentMemberId,
  familyId,
  invitations,
  members,
}: {
  childInvitations: ChildEmailInvitation[];
  currentMemberId: string;
  familyId: string;
  invitations: FamilyInvitation[];
  members: FamilyMemberWithDetails[];
}) {
  const adults = members.filter(
    (member) => member.role === "parent" || member.role === "caregiver",
  );
  const children = members.filter((member) => member.role === "child");
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const invitationByMemberId = new Map(
    pendingInvitations.map((invitation) => [invitation.memberId, invitation]),
  );
  const pendingChildInvitationByMemberId = new Map(
    childInvitations
      .filter((invitation) => invitation.status === "pending")
      .map((invitation) => [invitation.memberId, invitation]),
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Parents and caregivers
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Invite trusted adults without sharing your account.
            </p>
          </div>
          <StatusPill tone="info">
            {pendingInvitations.length} pending invites
          </StatusPill>
        </div>
        <div className="mt-4 grid gap-3">
          {adults.map((member) => (
            <AdultCard
              canEdit={member.id === currentMemberId}
              canDeactivate={member.id !== currentMemberId}
              familyId={familyId}
              invitation={invitationByMemberId.get(member.id)}
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Children
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Deactivated profiles stay in history and are not hard-deleted.
            </p>
          </div>
          <StatusPill tone="info">{children.length} profiles</StatusPill>
        </div>

        <div className="mt-5 grid gap-4">
          {children.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
              Add your first child profile below.
            </p>
          ) : null}

          {children.map((member) => (
            <ChildCard
              familyId={familyId}
              invitation={pendingChildInvitationByMemberId.get(member.id)}
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AdultCard({
  canEdit,
  canDeactivate,
  familyId,
  invitation,
  member,
}: {
  canEdit: boolean;
  canDeactivate: boolean;
  familyId: string;
  invitation?: FamilyInvitation;
  member: FamilyMemberWithDetails;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<string>();
  const isInactive = member.lifecycleStatus === "inactive";
  const isPending = invitation?.status === "pending";

  return (
    <article className="rounded-md border border-[var(--line)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar color={member.color} name={member.displayName} />
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              {member.displayName}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              {member.role === "parent" ? "Parent account" : "Caregiver"}
              {invitation ? ` · invited at ${invitation.emailNormalized}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {isPending ? (
                <StatusPill tone="info">Invite pending</StatusPill>
              ) : (
                <StatusPill tone={isInactive ? "warning" : "success"}>
                  {isInactive ? "Inactive" : "Active"}
                </StatusPill>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {canEdit ? (
            <button
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              onClick={() => {
                setStatus(undefined);
                setIsEditing(true);
              }}
              type="button"
            >
              Edit profile
            </button>
          ) : null}
          {isPending && invitation ? (
            <RevokeInvitationForm
              familyId={familyId}
              invitationId={invitation.id}
            />
          ) : null}
          {!isInactive && !isPending && canDeactivate ? (
            <DeactivateAdultForm familyId={familyId} memberId={member.id} />
          ) : null}
        </div>
      </div>

      <ActionMessage success={status} />

      {canEdit && isEditing ? (
        <Modal
          closeLabel="Close profile editor"
          eyebrow="Family profile"
          onClose={() => setIsEditing(false)}
          title={`Edit ${member.displayName}`}
        >
          <ParentProfileForm
            familyId={familyId}
            member={member}
            onSuccess={(message) => {
              setStatus(message);
              setIsEditing(false);
            }}
          />
        </Modal>
      ) : null}
    </article>
  );
}

function ParentProfileForm({
  familyId,
  member,
  onSuccess,
}: {
  familyId: string;
  member: FamilyMemberWithDetails;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction] = useActionState(updateParentProfile, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="grid gap-3">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={member.id} />
      <ActionMessage error={state.error} success={state.success} />
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Display name
        <input
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          defaultValue={member.displayName}
          maxLength={120}
          name="displayName"
          required
        />
      </label>
      <div>
        <SubmitButton pendingLabel="Saving profile..." tone="secondary">
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}

function ChildCard({
  familyId,
  invitation,
  member,
}: {
  familyId: string;
  invitation?: ChildEmailInvitation;
  member: FamilyMemberWithDetails;
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isInvitingByEmail, setIsInvitingByEmail] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>();
  const isInactive = member.lifecycleStatus === "inactive";
  const hasConnectedAccount = Boolean(member.profileId);
  const statusNote = member.currentStatus?.note?.trim();

  return (
    <article className="rounded-md border border-[var(--line)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Avatar color={member.color} name={member.displayName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[var(--foreground)]">
                {member.displayName}
              </h3>
              <StatusPill tone={isInactive ? "warning" : "success"}>
                {isInactive ? "Inactive" : "Active"}
              </StatusPill>
              <StatusPill tone="info">
                {statusLabels[member.currentStatus?.status ?? "normal"]}
              </StatusPill>
              <StatusPill tone={member.hasKidModePin ? "success" : "warning"}>
                {member.hasKidModePin ? "Kid PIN set" : "No Kid PIN"}
              </StatusPill>
              <StatusPill
                tone={
                  hasConnectedAccount
                    ? "success"
                    : invitation
                      ? "info"
                      : "warning"
                }
              >
                {hasConnectedAccount
                  ? "Email connected"
                  : invitation
                    ? "Email invite pending"
                    : "No email account"}
              </StatusPill>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Age {member.ageYears ?? "unknown"} · ability {member.abilityLevel}
              /5
            </p>
            {member.preferences?.notes ? (
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {member.preferences.notes}
              </p>
            ) : null}
            {statusNote ? (
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Status note: {statusNote}
              </p>
            ) : null}
          </div>
        </div>
        {!isInactive ? (
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            <button
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              onClick={() => {
                setActionStatus(undefined);
                setIsEditingProfile(true);
              }}
              type="button"
            >
              Edit profile
            </button>
            <button
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              onClick={() => setIsEditingStatus((current) => !current)}
              type="button"
            >
              {isEditingStatus ? "Cancel status" : "Set status"}
            </button>
            <button
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              onClick={() => setIsEditingPin((current) => !current)}
              type="button"
            >
              {isEditingPin ? "Cancel PIN" : "Kid PIN"}
            </button>
            {!hasConnectedAccount && !invitation ? (
              <button
                className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                onClick={() => {
                  setActionStatus(undefined);
                  setIsInvitingByEmail(true);
                }}
                type="button"
              >
                Connect email
              </button>
            ) : null}
            {invitation ? (
              <RevokeChildEmailInvitationForm
                familyId={familyId}
                invitationId={invitation.id}
              />
            ) : null}
            {hasConnectedAccount ? (
              <DisconnectChildEmailAccountForm
                familyId={familyId}
                memberId={member.id}
              />
            ) : null}
            <DeactivateChildForm familyId={familyId} memberId={member.id} />
          </div>
        ) : null}
      </div>

      <ActionMessage success={actionStatus} />

      {!isInactive && (isEditingStatus || isEditingPin) ? (
        <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5">
          {isEditingStatus ? (
            <section className="rounded-md bg-[var(--background)] p-4">
              <h4 className="text-sm font-semibold uppercase text-[var(--muted)]">
                Update status
              </h4>
              <MemberStatusForm familyId={familyId} member={member} />
            </section>
          ) : null}
          {isEditingPin ? (
            <section className="rounded-md bg-[var(--background)] p-4">
              <h4 className="text-sm font-semibold uppercase text-[var(--muted)]">
                Kid Mode PIN
              </h4>
              <KidModePinForm
                familyId={familyId}
                hasPin={member.hasKidModePin}
                memberId={member.id}
              />
            </section>
          ) : null}
        </div>
      ) : null}

      {!isInactive && isEditingProfile ? (
        <Modal
          closeLabel="Close child profile editor"
          eyebrow="Child profile"
          onClose={() => setIsEditingProfile(false)}
          title={`Edit ${member.displayName}`}
        >
          <EditChildMemberForm
            familyId={familyId}
            member={member}
            onSuccess={(message) => {
              setActionStatus(message);
              setIsEditingProfile(false);
            }}
          />
        </Modal>
      ) : null}

      {!isInactive &&
      isInvitingByEmail &&
      !hasConnectedAccount &&
      !invitation ? (
        <Modal
          closeLabel="Close child email connection"
          eyebrow="Child account"
          onClose={() => setIsInvitingByEmail(false)}
          title={`Connect email for ${member.displayName}`}
        >
          <InviteChildByEmailForm
            childName={member.displayName}
            familyId={familyId}
            memberId={member.id}
            onSuccess={(message) => {
              setActionStatus(message);
              setIsInvitingByEmail(false);
            }}
          />
        </Modal>
      ) : null}
    </article>
  );
}

function DeactivateChildForm({
  familyId,
  memberId,
}: {
  familyId: string;
  memberId: string;
}) {
  const [state, formAction] = useActionState(
    deactivateChildMember,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={memberId} />
      <SubmitButton pendingLabel="Deactivating..." tone="danger">
        Deactivate
      </SubmitButton>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function InviteChildByEmailForm({
  childName,
  familyId,
  memberId,
  onSuccess,
}: {
  childName: string;
  familyId: string;
  memberId: string;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction] = useActionState(inviteChildByEmail, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={memberId} />
      <p className="text-sm leading-6 text-[var(--muted)]">
        Send {childName} a secure email link. A new address can create a child
        sign-in, while an existing app account keeps its current password. Kid
        Mode and its PIN still work.
      </p>
      <ActionMessage error={state.error} />
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Child email
        <input
          autoComplete="email"
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground)]">
        <input
          className="mt-1 size-4"
          name="consent"
          required
          type="checkbox"
        />
        <span>
          I am the parent or guardian and am authorized to use this child&apos;s
          email address for their family account.
        </span>
      </label>
      <p className="text-xs leading-5 text-[var(--muted)]">
        Existing accounts can connect only when they do not already have active
        family access. Invitations expire after 14 days.
      </p>
      <div>
        <SubmitButton pendingLabel="Sending invitation...">
          Send connection email
        </SubmitButton>
      </div>
    </form>
  );
}

function RevokeChildEmailInvitationForm({
  familyId,
  invitationId,
}: {
  familyId: string;
  invitationId: string;
}) {
  const [state, formAction] = useActionState(
    revokeChildEmailInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="invitationId" type="hidden" value={invitationId} />
      <SubmitButton pendingLabel="Revoking..." tone="secondary">
        Revoke email invite
      </SubmitButton>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function DisconnectChildEmailAccountForm({
  familyId,
  memberId,
}: {
  familyId: string;
  memberId: string;
}) {
  const [state, formAction] = useActionState(
    disconnectChildEmailAccount,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={memberId} />
      <SubmitButton pendingLabel="Disconnecting..." tone="danger">
        Disconnect email
      </SubmitButton>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function RevokeInvitationForm({
  familyId,
  invitationId,
}: {
  familyId: string;
  invitationId: string;
}) {
  const [state, formAction] = useActionState(
    revokeFamilyInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="invitationId" type="hidden" value={invitationId} />
      <SubmitButton pendingLabel="Revoking..." tone="secondary">
        Revoke invite
      </SubmitButton>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function DeactivateAdultForm({
  familyId,
  memberId,
}: {
  familyId: string;
  memberId: string;
}) {
  const [state, formAction] = useActionState(
    deactivateAdultMember,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="memberId" type="hidden" value={memberId} />
      <SubmitButton pendingLabel="Deactivating..." tone="danger">
        Deactivate
      </SubmitButton>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function Avatar({ color, name }: { color: string | null; name: string }) {
  return (
    <div
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: color ?? "#047857" }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

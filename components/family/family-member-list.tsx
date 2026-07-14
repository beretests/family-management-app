"use client";

import { useActionState, useState } from "react";
import {
  deactivateChildMember,
  type FamilyActionState,
} from "@/features/family/actions";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { EditChildMemberForm } from "@/components/family/family-member-form";
import { KidModePinForm } from "@/components/family/kid-mode-pin-form";
import { MemberStatusForm } from "@/components/family/member-status-form";
import { StatusPill } from "@/components/ui/status-pill";

const initialState: FamilyActionState = {};

const statusLabels = {
  normal: "Normal",
  under_the_weather: "Under the weather",
  sick: "Sick",
  rest_day: "Rest day",
};

export function FamilyMemberList({
  familyId,
  members,
}: {
  familyId: string;
  members: FamilyMemberWithDetails[];
}) {
  const parents = members.filter((member) => member.role === "parent");
  const children = members.filter((member) => member.role === "child");

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Parents
        </h2>
        <div className="mt-4 grid gap-3">
          {parents.map((member) => (
            <article
              className="flex items-center gap-3 rounded-md border border-[var(--line)] p-3"
              key={member.id}
            >
              <Avatar color={member.color} name={member.displayName} />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {member.displayName}
                </h3>
                <p className="text-sm text-[var(--muted)]">Parent account</p>
              </div>
            </article>
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
            <ChildCard familyId={familyId} key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChildCard({
  familyId,
  member,
}: {
  familyId: string;
  member: FamilyMemberWithDetails;
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const isInactive = member.lifecycleStatus === "inactive";
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
              onClick={() => setIsEditingProfile((current) => !current)}
              type="button"
            >
              {isEditingProfile ? "Cancel edit" : "Edit profile"}
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
            <DeactivateChildForm familyId={familyId} memberId={member.id} />
          </div>
        ) : null}
      </div>

      {!isInactive && (isEditingProfile || isEditingStatus || isEditingPin) ? (
        <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5">
          {isEditingProfile ? (
            <section className="rounded-md bg-[var(--background)] p-4">
              <h4 className="text-sm font-semibold uppercase text-[var(--muted)]">
                Edit profile
              </h4>
              <EditChildMemberForm familyId={familyId} member={member} />
            </section>
          ) : null}
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
      <SubmitButton tone="danger">Deactivate</SubmitButton>
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

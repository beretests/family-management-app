"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";
import { AddChildMemberForm } from "@/components/family/family-member-form";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { Modal } from "@/components/ui/modal";
import {
  inviteAdultMember,
  type FamilyActionState,
} from "@/features/family/actions";

const initialState: FamilyActionState = {};
type OpenAction = "child" | "adult" | null;

export function FamilyActionToolbar({ familyId }: { familyId: string }) {
  const [openAction, setOpenAction] = useState<OpenAction>(null);
  const [status, setStatus] = useState<string>();

  function finishAction(message: string) {
    setStatus(message);
    setOpenAction(null);
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Family actions
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add a child profile or invite a trusted adult.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] sm:w-auto"
            onClick={() => {
              setStatus(undefined);
              setOpenAction("child");
            }}
            type="button"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Add child
          </button>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-white px-4 text-sm font-bold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)] sm:w-auto"
            onClick={() => {
              setStatus(undefined);
              setOpenAction("adult");
            }}
            type="button"
          >
            <UsersRound aria-hidden="true" className="size-4" />
            Invite adult
          </button>
        </div>
      </div>

      <ActionMessage success={status} />

      {openAction === "child" ? (
        <Modal
          closeLabel="Close add child"
          eyebrow="Family"
          onClose={() => setOpenAction(null)}
          title="Add a child"
        >
          <AddChildMemberForm familyId={familyId} onSuccess={finishAction} />
        </Modal>
      ) : null}

      {openAction === "adult" ? (
        <Modal
          closeLabel="Close adult invite"
          eyebrow="Family"
          onClose={() => setOpenAction(null)}
          title="Invite a parent or caregiver"
        >
          <InviteAdultForm familyId={familyId} onSuccess={finishAction} />
        </Modal>
      ) : null}
    </section>
  );
}

function InviteAdultForm({
  familyId,
  onSuccess,
}: {
  familyId: string;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction] = useActionState(inviteAdultMember, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="familyId" type="hidden" value={familyId} />
      <p className="text-sm leading-6 text-[var(--muted)]">
        They will receive a Supabase email invite and must sign in with that
        email to join this family.
      </p>
      <ActionMessage error={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Display name
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            maxLength={120}
            name="displayName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)] sm:max-w-xs">
        Role
        <select
          className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          name="role"
        >
          <option value="parent">Parent</option>
          <option value="caregiver">Caregiver</option>
        </select>
      </label>
      <div>
        <SubmitButton pendingLabel="Sending invite...">
          Send invite
        </SubmitButton>
      </div>
    </form>
  );
}

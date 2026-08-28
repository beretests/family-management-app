"use client";

import { useState } from "react";
import { CalendarPlus, Upload } from "lucide-react";
import { CreateScheduleEventForm } from "@/components/schedule/schedule-event-form";
import { IcsImportForm } from "@/components/schedule/ics-import-form";
import { Modal } from "@/components/ui/modal";
import type { FamilyMemberWithDetails } from "@/features/family/types";

type OpenAction = "create" | "import" | null;

export function ScheduleActionToolbar({
  actorMemberId,
  canManageAll,
  defaultEndsAt,
  defaultStartsAt,
  familyId,
  members,
  timeZone,
}: {
  actorMemberId: string;
  canManageAll: boolean;
  defaultEndsAt: string;
  defaultStartsAt: string;
  familyId: string;
  members: FamilyMemberWithDetails[];
  timeZone: string;
}) {
  const [openAction, setOpenAction] = useState<OpenAction>(null);
  const [status, setStatus] = useState<string>();

  function finishAction(message: string) {
    setStatus(message);
    setOpenAction(null);
  }

  return (
    <div className="grid w-full gap-2 lg:justify-items-end">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] sm:px-4"
          onClick={() => {
            setStatus(undefined);
            setOpenAction("create");
          }}
          type="button"
        >
          <CalendarPlus aria-hidden="true" className="size-4" />
          Add event
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-white px-3 text-sm font-bold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)] sm:px-4"
          onClick={() => {
            setStatus(undefined);
            setOpenAction("import");
          }}
          type="button"
        >
          <Upload aria-hidden="true" className="size-4" />
          Import calendar
        </button>
      </div>

      <p
        aria-live="polite"
        className="text-sm font-semibold text-[var(--accent-strong)]"
      >
        {status}
      </p>

      {openAction === "create" ? (
        <Modal
          closeLabel="Close add event"
          eyebrow="Calendar"
          onClose={() => setOpenAction(null)}
          title="Add schedule item"
        >
          <CreateScheduleEventForm
            actorMemberId={actorMemberId}
            canManageAll={canManageAll}
            defaultEndsAt={defaultEndsAt}
            defaultStartsAt={defaultStartsAt}
            familyId={familyId}
            members={members}
            onSuccess={finishAction}
            timeZone={timeZone}
          />
        </Modal>
      ) : null}

      {openAction === "import" ? (
        <Modal
          closeLabel="Close calendar import"
          eyebrow="Calendar"
          onClose={() => setOpenAction(null)}
          title="Import calendar file"
        >
          <IcsImportForm
            actorMemberId={actorMemberId}
            canManageAll={canManageAll}
            familyId={familyId}
            members={members}
            onSuccess={finishAction}
          />
        </Modal>
      ) : null}
    </div>
  );
}

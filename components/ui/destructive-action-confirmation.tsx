"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { SubmitButton } from "@/components/family/form-status";

export function DestructiveActionConfirmation({
  cancelLabel,
  confirmLabel,
  description,
  pendingLabel,
  submitName,
  submitValue,
  title,
  triggerLabel,
}: {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  pendingLabel: string;
  submitName?: string;
  submitValue?: string;
  title: string;
  triggerLabel: string;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { pending } = useFormStatus();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocusRef = useRef(false);

  useEffect(() => {
    if (isConfirming) {
      cancelRef.current?.focus();
      return;
    }

    if (restoreTriggerFocusRef.current) {
      restoreTriggerFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isConfirming]);

  if (!isConfirming) {
    return (
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--warning)] px-4 text-sm font-semibold text-[var(--warning)] transition hover:bg-[var(--warning-soft)] sm:w-auto"
        onClick={() => setIsConfirming(true)}
        ref={triggerRef}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {triggerLabel}
      </button>
    );
  }

  return (
    <fieldset
      aria-busy={pending}
      aria-describedby={descriptionId}
      className="col-span-full w-full rounded-lg border border-[var(--warning)] bg-[var(--warning-soft)] p-3"
    >
      <legend className="px-1 text-sm font-bold text-[var(--warning)]">
        {title}
      </legend>
      <p className="text-sm text-[var(--foreground)]" id={descriptionId}>
        {description}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <button
          className="min-h-11 w-full rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={pending}
          onClick={() => {
            restoreTriggerFocusRef.current = true;
            setIsConfirming(false);
          }}
          ref={cancelRef}
          type="button"
        >
          {cancelLabel}
        </button>
        <SubmitButton
          name={submitName}
          pendingLabel={pendingLabel}
          tone="danger"
          value={submitValue}
        >
          {confirmLabel}
        </SubmitButton>
      </div>
    </fieldset>
  );
}

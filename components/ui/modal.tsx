"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  children,
  closeLabel,
  eyebrow,
  onClose,
  title,
}: {
  children: React.ReactNode;
  closeLabel: string;
  eyebrow?: string;
  onClose: () => void;
  title: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow;

      if (dialog?.open && typeof dialog.close === "function") {
        dialog.close();
      }

      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-slate-950/55 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]"
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        onClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          onClose();
        }
      }}
      ref={dialogRef}
    >
      <div className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-strong)]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={`${eyebrow ? "mt-1" : ""} break-words text-xl font-extrabold sm:text-2xl`}
            id={titleId}
          >
            {title}
          </h2>
        </div>
        <button
          aria-label={closeLabel}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="min-w-0 p-4 sm:p-6">{children}</div>
    </dialog>
  );
}

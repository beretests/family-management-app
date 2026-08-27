"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  disabled = false,
  pendingLabel = "Working...",
  tone = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pendingLabel?: string;
  tone?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const className =
    tone === "danger"
      ? "min-h-11 w-full rounded-md border border-[var(--warning)] px-4 text-sm font-semibold text-[var(--warning)] transition hover:bg-[var(--warning-soft)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      : tone === "secondary"
        ? "min-h-11 w-full rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        : "min-h-11 w-full rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

  return (
    <button className={className} disabled={pending || disabled} type="submit">
      <span className="inline-flex items-center gap-2">
        {pending ? <Spinner /> : null}
        {pending ? pendingLabel : children}
      </span>
    </button>
  );
}

export function ActionMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  const message = error ?? success;
  const messageKey = message ? `${error ? "error" : "success"}:${message}` : "";
  const [dismissedMessageKey, setDismissedMessageKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        setDismissedMessageKey(messageKey);
      },
      error ? 10000 : 4500,
    );

    return () => window.clearTimeout(timeout);
  }, [error, message, messageKey]);

  if (!message || dismissedMessageKey === messageKey) {
    return null;
  }

  const className = error
    ? "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]"
    : "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]";

  return (
    <p
      className={`rounded-md border p-3 text-sm ${className}`}
      role={error ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function InlineLoading({ label = "Loading" }: { label?: string }) {
  return (
    <span
      aria-label={label}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      role="status"
    >
      <Spinner />
      {label}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

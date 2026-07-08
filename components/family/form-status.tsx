"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const className =
    tone === "danger"
      ? "min-h-10 rounded-md border border-[var(--warning)] px-4 text-sm font-semibold text-[var(--warning)] transition hover:bg-[var(--warning-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      : tone === "secondary"
        ? "min-h-10 rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        : "min-h-10 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? "Saving..." : children}
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
  if (!error && !success) {
    return null;
  }

  const className = error
    ? "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]"
    : "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]";

  return (
    <p className={`rounded-md border p-3 text-sm ${className}`}>
      {error ?? success}
    </p>
  );
}

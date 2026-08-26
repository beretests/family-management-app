"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/family/form-status";

export function AuthSubmitButton({
  children,
  disabled,
  pendingLabel,
}: {
  children: React.ReactNode;
  disabled: boolean;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-11 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <Spinner /> : null}
        {pending ? pendingLabel : children}
      </span>
    </button>
  );
}

export function AuthNotice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning";
}) {
  const noticeKey = `${tone}:${String(children)}`;
  const [dismissedNoticeKey, setDismissedNoticeKey] = useState<string | null>(
    null,
  );
  const className =
    tone === "success"
      ? "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      : "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]";

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        setDismissedNoticeKey(noticeKey);
      },
      tone === "success" ? 4500 : 10000,
    );

    return () => window.clearTimeout(timeout);
  }, [noticeKey, tone]);

  if (dismissedNoticeKey === noticeKey) {
    return null;
  }

  return (
    <div
      className={`mt-4 rounded-md border p-3 text-sm ${className}`}
      role={tone === "warning" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

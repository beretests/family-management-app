import type { ReactNode } from "react";

export type StatusTone = "success" | "info" | "warning";

const toneClasses: Record<StatusTone, string> = {
  success:
    "bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-1 ring-[var(--accent-soft)]",
  info: "bg-[var(--info-soft)] text-[var(--info)] ring-1 ring-[var(--info-soft)]",
  warning:
    "bg-[var(--warning-soft)] text-[var(--warning)] ring-1 ring-[var(--warning-soft)]",
};

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

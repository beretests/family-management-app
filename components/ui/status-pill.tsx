import type { ReactNode } from "react";

export type StatusTone = "success" | "info" | "warning";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  info: "bg-[var(--info-soft)] text-[var(--info)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
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
      className={`inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

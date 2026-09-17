import { School } from "lucide-react";
import type { ScheduleEventType } from "@/features/schedule/types";

export function SchoolEventBadge({
  eventType,
  compact = false,
}: {
  eventType: ScheduleEventType;
  compact?: boolean;
}) {
  if (eventType !== "school") return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white font-bold leading-none text-slate-800 ${compact ? "h-4 px-1 text-[0.625rem]" : "h-5 px-1.5 text-xs"}`}
      title="At school"
    >
      <School
        aria-hidden="true"
        className={compact ? "size-3 shrink-0" : "size-3.5 shrink-0"}
      />
      <span
        className={
          compact ? "sr-only @min-[8rem]/event:not-sr-only" : undefined
        }
      >
        At school
      </span>
    </span>
  );
}

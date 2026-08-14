import type { ScheduleRecurrence } from "@/features/schedule/types";

export type IcsEventStatus = "ready" | "duplicate" | "unsupported";

export type IcsPreviewEvent = {
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  timeZone: string | null;
  recurrence: ScheduleRecurrence | null;
  status: IcsEventStatus;
  reasons: string[];
  warnings: string[];
};

export type IcsPreview = {
  events: IcsPreviewEvent[];
  readyCount: number;
  duplicateCount: number;
  unsupportedCount: number;
};

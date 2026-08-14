import { z } from "zod";
import { scheduleEventTypes } from "@/features/schedule/schemas";
import { MAX_ICS_IMPORT_EVENTS } from "@/features/schedule/ics/parser";

const uniqueUids = z
  .array(z.string().trim().min(1).max(500))
  .max(MAX_ICS_IMPORT_EVENTS)
  .transform((values) => [...new Set(values)]);

export const findIcsDuplicatesSchema = z.object({
  familyId: z.string().uuid(),
  uids: z
    .array(z.string().trim().min(1).max(500))
    .max(500)
    .transform((values) => [...new Set(values)]),
});

export const importIcsEventsSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberIds: z
    .array(z.string().uuid("Choose valid family members."))
    .transform((values) => [...new Set(values)]),
  wholeFamily: z.boolean(),
  eventType: z.enum(scheduleEventTypes, { error: "Choose an event type." }),
  selectedUids: uniqueUids,
  browserTimeZone: z.string().trim().min(1).max(100),
});

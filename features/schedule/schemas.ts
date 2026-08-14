import { z } from "zod";

export const scheduleEventTypes = [
  "school",
  "extracurricular",
  "appointment",
  "family_event",
  "rest_sick",
  "parent_work",
  "parent_away",
  "parent_activity",
  "chore_task",
] as const;

export const scheduleRepeatTypes = [
  "none",
  "daily",
  "weekly",
  "yearly",
  "custom",
] as const;

export const scheduleRecurrenceEndTypes = ["never", "on", "after"] as const;

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value ? value : undefined));

const memberIds = z
  .array(z.string().uuid("Choose valid family members."))
  .default([])
  .transform((values) => [...new Set(values)]);

const dateTimeLocal = z
  .string()
  .trim()
  .min(1, "Choose a date and time.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Choose a valid date and time.",
  });

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number().int().min(1).max(1000).optional(),
);

const scheduleEventBaseSchema = z
  .object({
    familyId: z.string().uuid("Missing family."),
    memberIds,
    wholeFamily: z.coerce.boolean(),
    eventType: z.enum(scheduleEventTypes, { error: "Choose an event type." }),
    title: z
      .string()
      .trim()
      .min(1, "Enter a title.")
      .max(140, "Use 140 characters or fewer."),
    description: optionalTrimmedString(500, "Use 500 characters or fewer."),
    startsAt: dateTimeLocal,
    endsAt: dateTimeLocal,
    allDay: z.coerce.boolean(),
    location: optionalTrimmedString(160, "Use 160 characters or fewer."),
    color: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .pipe(
        z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid color.")
          .optional(),
      ),
    repeatType: z.enum(scheduleRepeatTypes).default("none"),
    recurrenceInterval: z.coerce.number().int().min(1).max(365).default(1),
    recurrenceWeekdays: z
      .array(z.coerce.number().int().min(0).max(6))
      .default([])
      .transform((values) => [...new Set(values)].sort()),
    recurrenceEndType: z.enum(scheduleRecurrenceEndTypes).default("never"),
    recurrenceEndsOn: z.string().trim().optional(),
    recurrenceCount: optionalPositiveInteger,
    timeZone: z.string().trim().min(1).max(100).default("UTC"),
  })
  .refine(
    (value) =>
      new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    {
      message: "End time must be after start time.",
      path: ["endsAt"],
    },
  )
  .refine((value) => value.wholeFamily || value.memberIds.length > 0, {
    message: "Choose whole family or at least one family member.",
    path: ["memberIds"],
  })
  .refine(
    (value) =>
      value.repeatType !== "custom" || value.recurrenceWeekdays.length > 0,
    {
      message: "Choose at least one weekday.",
      path: ["recurrenceWeekdays"],
    },
  )
  .refine(
    (value) =>
      value.repeatType === "none" ||
      value.recurrenceEndType !== "on" ||
      /^\d{4}-\d{2}-\d{2}$/.test(value.recurrenceEndsOn ?? ""),
    {
      message: "Choose when the series ends.",
      path: ["recurrenceEndsOn"],
    },
  )
  .refine(
    (value) =>
      value.repeatType === "none" ||
      value.recurrenceEndType !== "after" ||
      Boolean(value.recurrenceCount),
    {
      message: "Choose how many times the event repeats.",
      path: ["recurrenceCount"],
    },
  );

export const createScheduleEventSchema = scheduleEventBaseSchema;

export const updateScheduleEventSchema = scheduleEventBaseSchema.extend({
  eventId: z.string().uuid("Missing schedule event."),
});

export const deleteScheduleEventSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  eventId: z.string().uuid("Missing schedule event."),
});

export type CreateScheduleEventInput = z.infer<
  typeof createScheduleEventSchema
>;
export type UpdateScheduleEventInput = z.infer<
  typeof updateScheduleEventSchema
>;
export type DeleteScheduleEventInput = z.infer<
  typeof deleteScheduleEventSchema
>;

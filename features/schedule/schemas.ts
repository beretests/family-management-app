import { z } from "zod";

export const scheduleEventTypes = [
  "school",
  "extracurricular",
  "appointment",
  "family_event",
  "rest_sick",
  "parent_work",
  "chore_task",
] as const;

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().uuid("Choose a family member.").optional());

const dateTimeLocal = z
  .string()
  .trim()
  .min(1, "Choose a date and time.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Choose a valid date and time.",
  });

const scheduleEventBaseSchema = z
  .object({
    familyId: z.string().uuid("Missing family."),
    memberId: optionalUuid,
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
  })
  .refine(
    (value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    {
      message: "End time must be after start time.",
      path: ["endsAt"],
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

export type CreateScheduleEventInput = z.infer<typeof createScheduleEventSchema>;
export type UpdateScheduleEventInput = z.infer<typeof updateScheduleEventSchema>;
export type DeleteScheduleEventInput = z.infer<typeof deleteScheduleEventSchema>;

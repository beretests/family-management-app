import { z } from "zod";

export const choreFrequencies = [
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "ad_hoc",
] as const;

export const evidenceTypes = ["photo", "note"] as const;

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalEvidenceType = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.enum(evidenceTypes).optional());

const nonNegativeInteger = z.coerce
  .number({ error: "Enter a whole number." })
  .int("Use whole numbers.")
  .min(0, "Use 0 or higher.")
  .max(20, "Use 20 or fewer.");

export const houseProfileSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  kitchens: nonNegativeInteger,
  diningAreas: nonNegativeInteger,
  livingRooms: nonNegativeInteger,
  halfBathrooms: nonNegativeInteger,
  fullBathrooms: nonNegativeInteger,
  bedrooms: nonNegativeInteger,
  hasLaundryRoom: z.coerce.boolean(),
  hasStairs: z.coerce.boolean(),
  hasEntryway: z.coerce.boolean(),
  hasYard: z.coerce.boolean(),
  hasGarden: z.coerce.boolean(),
  hasGarage: z.coerce.boolean(),
  carChoresEnabled: z.coerce.boolean(),
  groceryChoresEnabled: z.coerce.boolean(),
  petsPresent: z.coerce.boolean(),
});

export const generateChoreTemplatesSchema = z.object({
  familyId: z.string().uuid("Missing family."),
});

const choreTemplateBaseSchema = z
  .object({
    familyId: z.string().uuid("Missing family."),
    title: z
      .string()
      .trim()
      .min(1, "Enter a chore title.")
      .max(140, "Use 140 characters or fewer."),
    emoji: optionalTrimmedString(24, "Use 24 characters or fewer."),
    description: optionalTrimmedString(500, "Use 500 characters or fewer."),
    category: z
      .string()
      .trim()
      .min(1, "Enter a category.")
      .max(80, "Use 80 characters or fewer."),
    location: optionalTrimmedString(120, "Use 120 characters or fewer."),
    frequency: z.enum(choreFrequencies, { error: "Choose a frequency." }),
    estimatedMinutes: z.coerce
      .number({ error: "Enter estimated minutes." })
      .int("Use whole minutes.")
      .min(1, "Use at least 1 minute.")
      .max(240, "Use 240 minutes or fewer."),
    difficulty: z.coerce.number().int().min(1).max(5),
    basePoints: z.coerce
      .number({ error: "Enter points." })
      .int("Use whole points.")
      .min(0)
      .max(500),
    minimumAge: z.coerce.number().int().min(0).max(18),
    maximumAge: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .pipe(z.number().int().min(0).max(18).optional()),
    requiresParentReview: z.coerce.boolean(),
    requiresEvidence: z.coerce.boolean(),
    evidenceType: optionalEvidenceType,
    undesirableScore: z.coerce.number().int().min(0).max(5),
    completionCheckText: optionalTrimmedString(
      500,
      "Use 500 characters or fewer.",
    ),
    safetyNotes: optionalTrimmedString(500, "Use 500 characters or fewer."),
    active: z.coerce.boolean(),
    subtasks: z
      .array(z.string().trim().min(1).max(180))
      .max(20, "Use 20 subtasks or fewer."),
  })
  .refine(
    (value) =>
      value.maximumAge === undefined || value.maximumAge >= value.minimumAge,
    {
      message: "Maximum age must be at least the minimum age.",
      path: ["maximumAge"],
    },
  )
  .refine((value) => value.requiresEvidence || !value.evidenceType, {
    message: "Choose an evidence type only when evidence is required.",
    path: ["evidenceType"],
  });

export const createChoreTemplateSchema = choreTemplateBaseSchema;

export const updateChoreTemplateSchema = choreTemplateBaseSchema.extend({
  templateId: z.string().uuid("Missing chore template."),
});

export const deleteChoreTemplateSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  templateId: z.string().uuid("Missing chore template."),
});

export type HouseProfileInput = z.infer<typeof houseProfileSchema>;
export type CreateChoreTemplateInput = z.infer<typeof createChoreTemplateSchema>;
export type UpdateChoreTemplateInput = z.infer<typeof updateChoreTemplateSchema>;

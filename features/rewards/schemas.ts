import { z } from "zod";

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalAge = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined))
  .pipe(z.number().int().min(0).max(18).optional());

const rewardCatalogBaseSchema = z
  .object({
    active: z.coerce.boolean(),
    description: optionalTrimmedString(500, "Use 500 characters or fewer."),
    familyId: z.string().uuid("Missing family."),
    maximumAge: optionalAge,
    minimumAge: optionalAge,
    pointsCost: z.coerce
      .number({ error: "Enter a point cost." })
      .int("Use whole points.")
      .min(0, "Use 0 or more points.")
      .max(10000, "Use 10,000 points or fewer."),
    title: z
      .string()
      .trim()
      .min(1, "Enter a reward title.")
      .max(120, "Use 120 characters or fewer."),
  })
  .refine(
    (value) =>
      value.maximumAge === undefined ||
      value.minimumAge === undefined ||
      value.maximumAge >= value.minimumAge,
    {
      message: "Maximum age must be at least the minimum age.",
      path: ["maximumAge"],
    },
  );

export const createRewardSchema = rewardCatalogBaseSchema;

export const updateRewardSchema = rewardCatalogBaseSchema.extend({
  rewardId: z.string().uuid("Missing reward."),
});

export const requestRewardRedemptionSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  note: optionalTrimmedString(300, "Use 300 characters or fewer."),
  rewardId: z.string().uuid("Missing reward."),
});

export const reviewRewardRedemptionSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  feedback: optionalTrimmedString(400, "Use 400 characters or fewer."),
  redemptionId: z.string().uuid("Missing redemption."),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;

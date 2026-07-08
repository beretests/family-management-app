import { z } from "zod";

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value ? value : undefined));

export const familySetupSchema = z.object({
  familyName: z
    .string()
    .trim()
    .min(1, "Enter a family name.")
    .max(120, "Use 120 characters or fewer."),
  parentDisplayName: z
    .string()
    .trim()
    .min(1, "Enter your display name.")
    .max(120, "Use 120 characters or fewer."),
});

export const childMemberSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a child name.")
    .max(120, "Use 120 characters or fewer."),
  ageYears: z.coerce
    .number({ error: "Enter an age." })
    .int("Age must be a whole number.")
    .min(1, "Age must be at least 1.")
    .max(18, "Use this flow for kids age 18 or younger."),
  abilityLevel: z.coerce
    .number({ error: "Choose an ability level." })
    .int()
    .min(1)
    .max(5),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid color."),
  notes: optionalTrimmedString(500, "Use 500 characters or fewer."),
});

export const updateChildMemberSchema = childMemberSchema.extend({
  memberId: z.string().uuid("Missing child profile."),
});

export const deactivateChildMemberSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberId: z.string().uuid("Missing child profile."),
});

export const memberStatusSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberId: z.string().uuid("Missing child profile."),
  status: z.enum(["normal", "under_the_weather", "sick", "rest_day"], {
    error: "Choose a status.",
  }),
  note: optionalTrimmedString(300, "Use 300 characters or fewer."),
});

export type FamilySetupInput = z.infer<typeof familySetupSchema>;
export type ChildMemberInput = z.infer<typeof childMemberSchema>;
export type UpdateChildMemberInput = z.infer<typeof updateChildMemberSchema>;
export type MemberStatusInput = z.infer<typeof memberStatusSchema>;

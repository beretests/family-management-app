import { z } from "zod";
import { calculateAgeYears } from "@/lib/dates/age";

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

const birthMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Choose a birth month and year.")
  .refine(
    (value) => {
      const [yearValue, monthValue] = value.split("-");
      const year = Number(yearValue);
      const month = Number(monthValue);
      const today = new Date();
      const birthdate = `${year}-${String(month).padStart(2, "0")}-01`;
      const age = calculateAgeYears(birthdate, today);

      return (
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12 &&
        new Date(year, month - 1, 1).getTime() <=
          new Date(today.getFullYear(), today.getMonth(), 1).getTime() &&
        age !== null &&
        age <= 18
      );
    },
    {
      message: "Use a birth month for a child age 18 or younger.",
    },
  );

export const childMemberSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a child name.")
    .max(120, "Use 120 characters or fewer."),
  birthMonth: birthMonthSchema,
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

export const childPinSchema = z
  .object({
    familyId: z.string().uuid("Missing family."),
    memberId: z.string().uuid("Missing child profile."),
    pin: z
      .string()
      .trim()
      .regex(/^\d{4,8}$/, "Use a 4 to 8 digit PIN."),
    confirmPin: z.string().trim(),
  })
  .refine((value) => value.pin === value.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
  });

export const updateParentProfileSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberId: z.string().uuid("Missing parent profile."),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(120, "Use 120 characters or fewer."),
});

export const adultInvitationRoles = ["parent", "caregiver"] as const;

export const adultInviteSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(120, "Use 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .toLowerCase()
    .max(254, "Use 254 characters or fewer."),
  role: z.enum(adultInvitationRoles, {
    error: "Choose parent or caregiver.",
  }),
});

export const acceptFamilyInvitationSchema = z.object({
  invitationId: z.string().uuid("Missing invitation."),
});

export const revokeFamilyInvitationSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  invitationId: z.string().uuid("Missing invitation."),
});

export const deactivateAdultMemberSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberId: z.string().uuid("Missing adult profile."),
});

export type FamilySetupInput = z.infer<typeof familySetupSchema>;
export type ChildMemberInput = z.infer<typeof childMemberSchema>;
export type UpdateChildMemberInput = z.infer<typeof updateChildMemberSchema>;
export type MemberStatusInput = z.infer<typeof memberStatusSchema>;
export type ChildPinInput = z.infer<typeof childPinSchema>;
export type UpdateParentProfileInput = z.infer<
  typeof updateParentProfileSchema
>;
export type AdultInviteInput = z.infer<typeof adultInviteSchema>;

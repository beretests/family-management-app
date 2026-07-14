import { z } from "zod";

export const unlockKidModeSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  memberId: z.string().uuid("Choose a child profile."),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the 4 to 8 digit PIN."),
});

export type UnlockKidModeInput = z.infer<typeof unlockKidModeSchema>;

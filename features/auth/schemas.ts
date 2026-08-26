import { z } from "zod";
import { normalizeRedirectPath } from "@/lib/auth/redirects";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters for your password.");

export const emailPasswordSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  next: z.string().optional().transform(normalizeRedirectPath),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type EmailPasswordInput = z.infer<typeof emailPasswordSchema>;

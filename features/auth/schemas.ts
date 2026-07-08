import { z } from "zod";
import { normalizeRedirectPath } from "@/lib/auth/redirects";

export const emailPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password."),
  next: z.string().optional().transform(normalizeRedirectPath),
});

export type EmailPasswordInput = z.infer<typeof emailPasswordSchema>;

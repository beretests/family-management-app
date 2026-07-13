import { z } from "zod";

const baseReviewSchema = z.object({
  familyId: z.uuid("Missing family."),
  pointsAwarded: z.coerce
    .number()
    .int("Points must be a whole number.")
    .min(0, "Points cannot be negative.")
    .max(1000, "Points value is too high."),
  submissionId: z.uuid("Missing submission."),
  taskId: z.uuid("Missing task."),
});

export const approveTaskSchema = baseReviewSchema;

export const rejectTaskSchema = baseReviewSchema.extend({
  feedback: z
    .string()
    .trim()
    .min(4, "Add a short, helpful note.")
    .max(500, "Feedback must be 500 characters or fewer."),
});

export type ApproveTaskInput = z.infer<typeof approveTaskSchema>;
export type RejectTaskInput = z.infer<typeof rejectTaskSchema>;

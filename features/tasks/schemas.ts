import { z } from "zod";

export const updateSubtaskSchema = z.object({
  completed: z.enum(["true", "false"]),
  subtaskId: z.uuid("Missing subtask."),
  taskId: z.uuid("Missing task."),
});

export const submitTaskSchema = z.object({
  note: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
  taskId: z.uuid("Missing task."),
});

export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;

import { z } from "zod";

const dateParamPattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

export const createAssignmentsSchema = z.object({
  assignmentDate: z
    .string()
    .regex(dateParamPattern, "Choose a valid assignment date."),
  dueTime: z.string().regex(timePattern, "Choose a valid due time."),
  familyId: z.uuid("Missing family."),
  selections: z
    .array(
      z.object({
        memberId: z.uuid("Choose an eligible child."),
        templateId: z.uuid("Missing chore template."),
      }),
    )
    .min(1, "Choose at least one assignment."),
});

export type CreateAssignmentsInput = z.infer<typeof createAssignmentsSchema>;

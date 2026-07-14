"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFamilyContext } from "@/features/family/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ReminderActionState = {
  error?: string;
  success?: string;
};

const dismissReminderSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  reminderId: z.string().uuid("Missing reminder."),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function dismissReminder(
  _previousState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const parsed = dismissReminderSchema.safeParse({
    familyId: getString(formData, "familyId"),
    reminderId: getString(formData, "reminderId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    const context = await getFamilyContext();

    if (!context.family || !context.currentMember) {
      throw new Error("Family setup is required.");
    }

    if (context.family.id !== parsed.data.familyId) {
      throw new Error("Reminder is not available for this family.");
    }

    const supabase = await createClient();
    const { data: reminder, error: reminderError } = await supabase
      .from("reminders")
      .select("id,family_id,member_id,status")
      .eq("family_id", context.family.id)
      .eq("id", parsed.data.reminderId)
      .maybeSingle();

    if (reminderError) {
      throw new Error(reminderError.message);
    }

    if (!reminder?.id) {
      throw new Error("Reminder is not available.");
    }

    const canDismiss =
      context.currentMember.role === "parent" ||
      context.currentMember.role === "caregiver" ||
      reminder.member_id === context.currentMember.id;

    if (!canDismiss) {
      throw new Error("You can only dismiss your own reminders.");
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("reminders")
      .update({
        status: "dismissed",
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", context.family.id)
      .eq("id", parsed.data.reminderId);

    if (updateError) {
      return { error: updateError.message };
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  return { success: "Reminder dismissed." };
}

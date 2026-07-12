"use server";

import { revalidatePath } from "next/cache";
import {
  createScheduleEventSchema,
  deleteScheduleEventSchema,
  updateScheduleEventSchema,
} from "@/features/schedule/schemas";
import { dateTimeLocalToIso } from "@/lib/dates/schedule";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";

export type ScheduleActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function ensureMemberBelongsToFamily({
  familyId,
  memberId,
  supabase,
}: {
  familyId: string;
  memberId?: string;
  supabase: AppSupabaseClient;
}) {
  if (!memberId) {
    return;
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("id", memberId)
    .eq("lifecycle_status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Choose an active family member.");
  }
}

async function insertAuditEvent({
  action,
  actorMemberId,
  familyId,
  supabase,
  target,
}: {
  action: string;
  actorMemberId: string;
  familyId: string;
  supabase: AppSupabaseClient;
  target: Record<string, unknown>;
}) {
  await supabase.from("audit_events").insert({
    action,
    actor_member_id: actorMemberId,
    family_id: familyId,
    metadata: target,
  });
}

function readScheduleEventForm(formData: FormData) {
  return {
    familyId: getString(formData, "familyId"),
    memberId: getString(formData, "memberId"),
    eventType: getString(formData, "eventType"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    startsAt: getString(formData, "startsAt"),
    endsAt: getString(formData, "endsAt"),
    allDay: getBoolean(formData, "allDay"),
    location: getString(formData, "location"),
    color: getString(formData, "color"),
  };
}

export async function createScheduleEvent(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const parsed = createScheduleEventSchema.safeParse(readScheduleEventForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    await ensureMemberBelongsToFamily({
      familyId: parent.familyId,
      memberId: parsed.data.memberId,
      supabase,
    });

    const eventId = crypto.randomUUID();
    const { error } = await supabase.from("schedule_events").insert({
      id: eventId,
      family_id: parent.familyId,
      member_id: parsed.data.memberId ?? null,
      created_by_member_id: parent.memberId,
      event_type: parsed.data.eventType,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      starts_at: dateTimeLocalToIso(parsed.data.startsAt),
      ends_at: dateTimeLocalToIso(parsed.data.endsAt),
      all_day: parsed.data.allDay,
      location: parsed.data.location ?? null,
      color: parsed.data.color ?? null,
    });

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "schedule_event.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { eventId, memberId: parsed.data.memberId ?? null },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  return { success: "Schedule event added." };
}

export async function updateScheduleEvent(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const parsed = updateScheduleEventSchema.safeParse({
    ...readScheduleEventForm(formData),
    eventId: getString(formData, "eventId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    await ensureMemberBelongsToFamily({
      familyId: parent.familyId,
      memberId: parsed.data.memberId,
      supabase,
    });

    const { error } = await supabase
      .from("schedule_events")
      .update({
        member_id: parsed.data.memberId ?? null,
        event_type: parsed.data.eventType,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        starts_at: dateTimeLocalToIso(parsed.data.startsAt),
        ends_at: dateTimeLocalToIso(parsed.data.endsAt),
        all_day: parsed.data.allDay,
        location: parsed.data.location ?? null,
        color: parsed.data.color ?? null,
      })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.eventId);

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "schedule_event.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { eventId: parsed.data.eventId, memberId: parsed.data.memberId ?? null },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  return { success: "Schedule event updated." };
}

export async function deleteScheduleEvent(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const parsed = deleteScheduleEventSchema.safeParse({
    familyId: getString(formData, "familyId"),
    eventId: getString(formData, "eventId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { error } = await supabase
      .from("schedule_events")
      .delete()
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.eventId);

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "schedule_event.deleted",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { eventId: parsed.data.eventId },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  return { success: "Schedule event deleted." };
}

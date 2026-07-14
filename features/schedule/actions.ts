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

async function ensureMembersBelongToFamily({
  familyId,
  memberIds,
  supabase,
}: {
  familyId: string;
  memberIds: string[];
  supabase: AppSupabaseClient;
}) {
  if (memberIds.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .in("id", memberIds)
    .eq("lifecycle_status", "active")
    .limit(memberIds.length);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== memberIds.length) {
    throw new Error("Choose active family members.");
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
    memberIds: formData
      .getAll("memberIds")
      .filter((value): value is string => typeof value === "string"),
    wholeFamily: getBoolean(formData, "wholeFamily"),
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

function selectedMemberIds(input: { memberIds: string[]; wholeFamily: boolean }) {
  return input.wholeFamily ? [] : input.memberIds;
}

async function replaceScheduleEventMembers({
  eventId,
  familyId,
  memberIds,
  supabase,
}: {
  eventId: string;
  familyId: string;
  memberIds: string[];
  supabase: AppSupabaseClient;
}) {
  const { error: deleteError } = await supabase
    .from("schedule_event_members")
    .delete()
    .eq("family_id", familyId)
    .eq("schedule_event_id", eventId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (memberIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("schedule_event_members")
    .insert(
      memberIds.map((memberId) => ({
        family_id: familyId,
        member_id: memberId,
        schedule_event_id: eventId,
      })),
    );

  if (insertError) {
    throw new Error(insertError.message);
  }
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
    const memberIds = selectedMemberIds(parsed.data);
    await ensureMembersBelongToFamily({
      familyId: parent.familyId,
      memberIds,
      supabase,
    });

    const eventId = crypto.randomUUID();
    const { error } = await supabase.from("schedule_events").insert({
      id: eventId,
      family_id: parent.familyId,
      member_id: memberIds[0] ?? null,
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

    try {
      await replaceScheduleEventMembers({
        eventId,
        familyId: parent.familyId,
        memberIds,
        supabase,
      });
    } catch (memberError) {
      await supabase
        .from("schedule_events")
        .delete()
        .eq("family_id", parent.familyId)
        .eq("id", eventId);
      throw memberError;
    }

    await insertAuditEvent({
      action: "schedule_event.created",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { eventId, memberIds },
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
    const memberIds = selectedMemberIds(parsed.data);
    await ensureMembersBelongToFamily({
      familyId: parent.familyId,
      memberIds,
      supabase,
    });

    const { error } = await supabase
      .from("schedule_events")
      .update({
        member_id: memberIds[0] ?? null,
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

    await replaceScheduleEventMembers({
      eventId: parsed.data.eventId,
      familyId: parent.familyId,
      memberIds,
      supabase,
    });

    await insertAuditEvent({
      action: "schedule_event.updated",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: { eventId: parsed.data.eventId, memberIds },
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

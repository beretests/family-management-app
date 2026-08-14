"use server";

import { revalidatePath } from "next/cache";
import {
  createScheduleEventSchema,
  deleteScheduleEventSchema,
  updateScheduleEventSchema,
} from "@/features/schedule/schemas";
import { dateTimeLocalToIso } from "@/lib/dates/schedule";
import {
  getCurrentActorMemberIds,
  getVerifiedChildSessionContext,
  requireParentContext,
} from "@/lib/permissions/family";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ScheduleActionState = {
  error?: string;
  success?: string;
};

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ScheduleActor = {
  familyId: string;
  memberId: string;
  role: "parent" | "caregiver" | "child";
  writeClient: AppSupabaseClient;
};

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
    repeatType: getString(formData, "repeatType") || "none",
    recurrenceInterval: getString(formData, "recurrenceInterval") || "1",
    recurrenceWeekdays: formData
      .getAll("recurrenceWeekdays")
      .filter((value): value is string => typeof value === "string"),
    recurrenceEndType: getString(formData, "recurrenceEndType") || "never",
    recurrenceEndsOn: getString(formData, "recurrenceEndsOn"),
    recurrenceCount: getString(formData, "recurrenceCount"),
    timeZone: getString(formData, "timeZone") || "UTC",
  };
}

function selectedMemberIds(input: {
  memberIds: string[];
  wholeFamily: boolean;
}) {
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

async function requireScheduleActor(
  supabase: AppSupabaseClient,
  familyId: string,
): Promise<ScheduleActor> {
  const childSession = await getVerifiedChildSessionContext(supabase, familyId);

  if (childSession) {
    return {
      familyId,
      memberId: childSession.memberId,
      role: "child",
      writeClient: createAdminClient() as AppSupabaseClient,
    };
  }

  const memberIds = await getCurrentActorMemberIds(supabase, familyId);

  if (memberIds.length === 0) {
    throw new Error("You must be an active family member.");
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id,role")
    .eq("family_id", familyId)
    .eq("lifecycle_status", "active")
    .in("id", memberIds)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("You must be an active family member.");
  }

  return {
    familyId,
    memberId: data.id as string,
    role: data.role as ScheduleActor["role"],
    writeClient: supabase,
  };
}

function enforceAttendeePermission(actor: ScheduleActor, memberIds: string[]) {
  if (actor.role === "parent") {
    return;
  }

  if (memberIds.length !== 1 || memberIds[0] !== actor.memberId) {
    throw new Error(
      "Family members can add schedule events only for themselves.",
    );
  }
}

function validateTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new Error("Choose a valid time zone.");
  }
}

function recurrenceRow(
  eventId: string,
  familyId: string,
  input: ReturnType<typeof createScheduleEventSchema.parse>,
) {
  if (input.repeatType === "none") {
    return null;
  }

  validateTimeZone(input.timeZone);

  return {
    event_id: eventId,
    family_id: familyId,
    frequency: input.repeatType === "custom" ? "weekly" : input.repeatType,
    interval_count: input.recurrenceInterval,
    weekdays: input.repeatType === "custom" ? input.recurrenceWeekdays : [],
    ends_on: input.recurrenceEndType === "on" ? input.recurrenceEndsOn : null,
    occurrence_count:
      input.recurrenceEndType === "after" ? input.recurrenceCount : null,
    time_zone: input.timeZone,
  };
}

async function replaceScheduleEventRecurrence({
  eventId,
  familyId,
  input,
  supabase,
}: {
  eventId: string;
  familyId: string;
  input: ReturnType<typeof createScheduleEventSchema.parse>;
  supabase: AppSupabaseClient;
}) {
  const row = recurrenceRow(eventId, familyId, input);

  if (!row) {
    const { error } = await supabase
      .from("schedule_event_recurrences")
      .delete()
      .eq("family_id", familyId)
      .eq("event_id", eventId);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await supabase
    .from("schedule_event_recurrences")
    .upsert(row, { onConflict: "event_id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createScheduleEvent(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const parsed = createScheduleEventSchema.safeParse(
    readScheduleEventForm(formData),
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireScheduleActor(supabase, parsed.data.familyId);
    const memberIds = selectedMemberIds(parsed.data);
    enforceAttendeePermission(actor, memberIds);
    await ensureMembersBelongToFamily({
      familyId: actor.familyId,
      memberIds,
      supabase,
    });

    const eventId = crypto.randomUUID();
    const { error } = await actor.writeClient.from("schedule_events").insert({
      id: eventId,
      family_id: actor.familyId,
      member_id: memberIds[0] ?? null,
      created_by_member_id: actor.memberId,
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
        familyId: actor.familyId,
        memberIds,
        supabase: actor.writeClient,
      });
      await replaceScheduleEventRecurrence({
        eventId,
        familyId: actor.familyId,
        input: parsed.data,
        supabase: actor.writeClient,
      });
    } catch (memberError) {
      await actor.writeClient
        .from("schedule_events")
        .delete()
        .eq("family_id", actor.familyId)
        .eq("id", eventId);
      throw memberError;
    }

    await insertAuditEvent({
      action: "schedule_event.created",
      actorMemberId: actor.memberId,
      familyId: actor.familyId,
      supabase: actor.writeClient,
      target: { eventId, memberIds, repeatType: parsed.data.repeatType },
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
    const actor = await requireScheduleActor(supabase, parsed.data.familyId);
    const memberIds = selectedMemberIds(parsed.data);
    enforceAttendeePermission(actor, memberIds);
    await ensureMembersBelongToFamily({
      familyId: actor.familyId,
      memberIds,
      supabase,
    });

    const { data: existingEvent, error: existingError } = await supabase
      .from("schedule_events")
      .select("id,created_by_member_id")
      .eq("family_id", actor.familyId)
      .eq("id", parsed.data.eventId)
      .maybeSingle();

    if (existingError) {
      return { error: existingError.message };
    }

    if (!existingEvent) {
      return { error: "Schedule event not found." };
    }

    if (
      actor.role !== "parent" &&
      existingEvent.created_by_member_id !== actor.memberId
    ) {
      return { error: "You can edit only schedule events you added." };
    }

    const { data: updatedEvent, error } = await actor.writeClient
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
      .eq("family_id", actor.familyId)
      .eq("id", parsed.data.eventId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!updatedEvent) {
      return { error: "You do not have permission to edit this event." };
    }

    await replaceScheduleEventMembers({
      eventId: parsed.data.eventId,
      familyId: actor.familyId,
      memberIds,
      supabase: actor.writeClient,
    });
    await replaceScheduleEventRecurrence({
      eventId: parsed.data.eventId,
      familyId: actor.familyId,
      input: parsed.data,
      supabase: actor.writeClient,
    });

    await insertAuditEvent({
      action: "schedule_event.updated",
      actorMemberId: actor.memberId,
      familyId: actor.familyId,
      supabase: actor.writeClient,
      target: {
        eventId: parsed.data.eventId,
        memberIds,
        repeatType: parsed.data.repeatType,
      },
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

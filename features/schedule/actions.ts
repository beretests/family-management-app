"use server";

import { revalidatePath } from "next/cache";
import {
  createScheduleEventSchema,
  deleteScheduleEventSchema,
  updateScheduleEventSchema,
} from "@/features/schedule/schemas";
import { dateTimeLocalToIso } from "@/lib/dates/schedule";
import { requireParentContext } from "@/lib/permissions/family";
import {
  enforceAttendeePermission,
  ensureMembersBelongToFamily,
  requireScheduleActor,
  type AppSupabaseClient,
} from "@/features/schedule/permissions";
import { createClient } from "@/lib/supabase/server";
import { getRecurrenceOccurrenceNumber } from "@/features/schedule/recurrence";
import { normalizeAllDayFormRange } from "@/features/schedule/all-day";

export type ScheduleActionState = {
  error?: string;
  eventId?: string;
  replayed?: boolean;
  success?: string;
  submissionId?: string;
};

type ScheduleEventMutationInput = Omit<
  ReturnType<typeof createScheduleEventSchema.parse>,
  "idempotencyKey"
>;

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
  const eventType = getString(formData, "eventType");
  const allDay = eventType === "no_school" || getBoolean(formData, "allDay");
  const rawStartsAt = getString(formData, "startsAt");
  const rawEndsAt = getString(formData, "endsAt");
  const range = allDay
    ? normalizeAllDayFormRange(rawStartsAt, rawEndsAt)
    : { startsAt: rawStartsAt, endsAt: rawEndsAt };

  return {
    familyId: getString(formData, "familyId"),
    idempotencyKey: getString(formData, "idempotencyKey"),
    memberIds: formData
      .getAll("memberIds")
      .filter((value): value is string => typeof value === "string"),
    wholeFamily: getBoolean(formData, "wholeFamily"),
    eventType,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    startsAt: range.startsAt,
    endsAt: range.endsAt,
    allDay,
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
    editScope: getString(formData, "editScope") || "series",
    occurrenceDate: getString(formData, "occurrenceDate") || undefined,
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
  input: ScheduleEventMutationInput,
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

function eventPayload(input: ScheduleEventMutationInput) {
  return {
    event_type: input.eventType,
    title: input.title,
    description: input.description ?? null,
    starts_at: dateTimeLocalToIso(input.startsAt, input.timeZone),
    ends_at: dateTimeLocalToIso(input.endsAt, input.timeZone),
    all_day: input.allDay,
    location: input.location ?? null,
    color: input.color ?? null,
  };
}

function finishScheduleMutation() {
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
}

async function replaceScheduleEventRecurrence({
  eventId,
  familyId,
  input,
  supabase,
}: {
  eventId: string;
  familyId: string;
  input: ScheduleEventMutationInput;
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
  const eventId = crypto.randomUUID();
  let savedEventId = eventId;
  let replayed = false;

  try {
    const actor = await requireScheduleActor(supabase, parsed.data.familyId);
    const memberIds = selectedMemberIds(parsed.data);
    enforceAttendeePermission(actor, memberIds);
    await ensureMembersBelongToFamily({
      familyId: actor.familyId,
      memberIds,
      supabase,
    });

    const { error } = await actor.writeClient.from("schedule_events").insert({
      id: eventId,
      family_id: actor.familyId,
      member_id: memberIds[0] ?? null,
      created_by_member_id: actor.memberId,
      idempotency_key: parsed.data.idempotencyKey,
      ...eventPayload(parsed.data),
    });

    if (error) {
      if (error.code === "23505") {
        const { data: existingEvent, error: existingError } =
          await actor.writeClient
            .from("schedule_events")
            .select("id")
            .eq("family_id", actor.familyId)
            .eq("created_by_member_id", actor.memberId)
            .eq("idempotency_key", parsed.data.idempotencyKey)
            .maybeSingle();

        if (existingError) {
          return { error: existingError.message };
        }

        if (existingEvent) {
          savedEventId = existingEvent.id;
          replayed = true;
        }
      }

      if (!replayed) {
        return { error: error.message };
      }
    }

    if (!replayed) {
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
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishScheduleMutation();
  return {
    eventId: savedEventId,
    replayed,
    success: "Schedule event added.",
    submissionId: crypto.randomUUID(),
  };
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
      .select("id,created_by_member_id,starts_at")
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

    const { data: recurrence, error: recurrenceError } = await supabase
      .from("schedule_event_recurrences")
      .select(
        "frequency,interval_count,weekdays,ends_on,occurrence_count,time_zone",
      )
      .eq("family_id", actor.familyId)
      .eq("event_id", parsed.data.eventId)
      .maybeSingle();

    if (recurrenceError) {
      return { error: recurrenceError.message };
    }

    if (parsed.data.editScope !== "series" && !recurrence) {
      return { error: "This event is not part of a recurring series." };
    }

    const occurrenceNumber =
      recurrence && parsed.data.occurrenceDate
        ? getRecurrenceOccurrenceNumber({
            occurrenceDate: parsed.data.occurrenceDate,
            recurrence: {
              frequency: recurrence.frequency,
              interval: recurrence.interval_count,
              weekdays: recurrence.weekdays,
              endsOn: recurrence.ends_on,
              occurrenceCount: recurrence.occurrence_count,
              timeZone: recurrence.time_zone,
            },
            seriesStartsAt: existingEvent.starts_at,
          })
        : null;

    if (parsed.data.editScope !== "series" && !occurrenceNumber) {
      return { error: "The selected occurrence is not part of this series." };
    }

    const isFirstOccurrence = occurrenceNumber === 1;

    if (parsed.data.editScope === "occurrence") {
      const { error } = await actor.writeClient.rpc(
        "upsert_schedule_occurrence_override",
        {
          p_actor_member_id: actor.memberId,
          p_event: eventPayload(parsed.data),
          p_family_id: actor.familyId,
          p_member_ids: memberIds,
          p_occurrence_date: parsed.data.occurrenceDate,
          p_series_event_id: parsed.data.eventId,
          p_status: "modified",
        },
      );

      if (error) {
        return { error: error.message };
      }
    } else if (parsed.data.editScope === "following" && !isFirstOccurrence) {
      const newEventId = crypto.randomUUID();
      const row = recurrenceRow(newEventId, actor.familyId, parsed.data);

      if (!row) {
        return {
          error:
            "This and following events must continue as a repeating series.",
        };
      }

      const { error } = await actor.writeClient.rpc(
        "split_schedule_event_series",
        {
          p_actor_member_id: actor.memberId,
          p_event: eventPayload(parsed.data),
          p_family_id: actor.familyId,
          p_member_ids: memberIds,
          p_new_event_id: newEventId,
          p_recurrence: {
            ends_on: row.ends_on,
            frequency: row.frequency,
            interval_count: row.interval_count,
            occurrence_count: row.occurrence_count,
            time_zone: row.time_zone,
            weekdays: row.weekdays,
          },
          p_series_event_id: parsed.data.eventId,
          p_split_date: parsed.data.occurrenceDate,
        },
      );

      if (error) {
        return { error: error.message };
      }
    } else {
      const { data: updatedEvent, error } = await actor.writeClient
        .from("schedule_events")
        .update({
          member_id: memberIds[0] ?? null,
          ...eventPayload(parsed.data),
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
    }

    await insertAuditEvent({
      action: "schedule_event.updated",
      actorMemberId: actor.memberId,
      familyId: actor.familyId,
      supabase: actor.writeClient,
      target: {
        eventId: parsed.data.eventId,
        editScope: parsed.data.editScope,
        occurrenceDate: parsed.data.occurrenceDate,
        memberIds,
        repeatType: parsed.data.repeatType,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishScheduleMutation();
  return {
    success: "Schedule event updated.",
    submissionId: crypto.randomUUID(),
  };
}

export async function deleteScheduleEvent(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const parsed = deleteScheduleEventSchema.safeParse({
    familyId: getString(formData, "familyId"),
    eventId: getString(formData, "eventId"),
    editScope: getString(formData, "editScope") || "series",
    occurrenceDate: getString(formData, "occurrenceDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data: existingEvent, error: existingError } = await supabase
      .from("schedule_events")
      .select("id,starts_at")
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.eventId)
      .maybeSingle();

    if (existingError) {
      return { error: existingError.message };
    }

    if (!existingEvent) {
      return { error: "Schedule event not found." };
    }

    const { data: recurrence, error: recurrenceError } = await supabase
      .from("schedule_event_recurrences")
      .select(
        "frequency,interval_count,weekdays,ends_on,occurrence_count,time_zone",
      )
      .eq("family_id", parent.familyId)
      .eq("event_id", parsed.data.eventId)
      .maybeSingle();

    if (recurrenceError) {
      return { error: recurrenceError.message };
    }

    if (parsed.data.editScope !== "series" && !recurrence) {
      return { error: "This event is not part of a recurring series." };
    }

    const occurrenceNumber =
      recurrence && parsed.data.occurrenceDate
        ? getRecurrenceOccurrenceNumber({
            occurrenceDate: parsed.data.occurrenceDate,
            recurrence: {
              frequency: recurrence.frequency,
              interval: recurrence.interval_count,
              weekdays: recurrence.weekdays,
              endsOn: recurrence.ends_on,
              occurrenceCount: recurrence.occurrence_count,
              timeZone: recurrence.time_zone,
            },
            seriesStartsAt: existingEvent.starts_at,
          })
        : null;

    if (parsed.data.editScope !== "series" && !occurrenceNumber) {
      return { error: "The selected occurrence is not part of this series." };
    }

    const isFirstOccurrence = occurrenceNumber === 1;
    let error: { message: string } | null = null;

    if (parsed.data.editScope === "occurrence") {
      ({ error } = await supabase.rpc("upsert_schedule_occurrence_override", {
        p_actor_member_id: parent.memberId,
        p_event: null,
        p_family_id: parent.familyId,
        p_member_ids: [],
        p_occurrence_date: parsed.data.occurrenceDate,
        p_series_event_id: parsed.data.eventId,
        p_status: "cancelled",
      }));
    } else if (parsed.data.editScope === "following" && !isFirstOccurrence) {
      ({ error } = await supabase.rpc("truncate_schedule_event_series", {
        p_family_id: parent.familyId,
        p_series_event_id: parsed.data.eventId,
        p_split_date: parsed.data.occurrenceDate,
      }));
    } else {
      ({ error } = await supabase
        .from("schedule_events")
        .delete()
        .eq("family_id", parent.familyId)
        .eq("id", parsed.data.eventId));
    }

    if (error) {
      return { error: error.message };
    }

    await insertAuditEvent({
      action: "schedule_event.deleted",
      actorMemberId: parent.memberId,
      familyId: parent.familyId,
      supabase,
      target: {
        eventId: parsed.data.eventId,
        editScope: parsed.data.editScope,
        occurrenceDate: parsed.data.occurrenceDate,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishScheduleMutation();
  return {
    success: "Schedule event deleted.",
    submissionId: crypto.randomUUID(),
  };
}

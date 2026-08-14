"use server";

import { revalidatePath } from "next/cache";
import {
  MAX_ICS_FILE_BYTES,
  MAX_ICS_IMPORT_EVENTS,
  parseIcsCalendar,
} from "@/features/schedule/ics/parser";
import {
  findIcsDuplicatesSchema,
  importIcsEventsSchema,
} from "@/features/schedule/ics/schemas";
import {
  enforceAttendeePermission,
  ensureMembersBelongToFamily,
  requireScheduleActor,
  type AppSupabaseClient,
} from "@/features/schedule/permissions";
import { createClient } from "@/lib/supabase/server";

const acceptedCalendarTypes = new Set([
  "",
  "application/ics",
  "application/octet-stream",
  "text/calendar",
  "text/plain",
]);

export type IcsImportActionState = {
  error?: string;
  success?: string;
  importedCount?: number;
  duplicateCount?: number;
  failedCount?: number;
};

export async function findDuplicateIcsUids(input: unknown): Promise<string[]> {
  const parsed = findIcsDuplicatesSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("The duplicate check request is invalid.");
  }

  if (parsed.data.uids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  await requireScheduleActor(supabase, parsed.data.familyId);
  const duplicateUids = new Set<string>();

  for (const uids of chunks(parsed.data.uids, 50)) {
    const { data, error } = await supabase
      .from("schedule_events")
      .select("import_uid")
      .eq("family_id", parsed.data.familyId)
      .in("import_uid", uids);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      if (typeof row.import_uid === "string") {
        duplicateUids.add(row.import_uid);
      }
    }
  }

  return [...duplicateUids];
}

export async function importIcsEvents(
  _previousState: IcsImportActionState,
  formData: FormData,
): Promise<IcsImportActionState> {
  const calendarFile = formData.get("calendarFile");
  const parsed = importIcsEventsSchema.safeParse({
    familyId: getString(formData, "familyId"),
    memberIds: getStrings(formData, "memberIds"),
    wholeFamily: formData.get("wholeFamily") === "on",
    eventType: getString(formData, "eventType"),
    selectedUids: getStrings(formData, "selectedUids"),
    browserTimeZone: getString(formData, "browserTimeZone") || "UTC",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the import." };
  }

  const fileError = validateCalendarFile(calendarFile);

  if (fileError) {
    return { error: fileError };
  }

  const file = calendarFile as File;

  if (parsed.data.selectedUids.length === 0) {
    return { error: "Choose at least one supported event to import." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireScheduleActor(supabase, parsed.data.familyId);
    const memberIds = parsed.data.wholeFamily ? [] : parsed.data.memberIds;
    enforceAttendeePermission(actor, memberIds);
    await ensureMembersBelongToFamily({
      familyId: actor.familyId,
      memberIds,
      supabase,
    });

    if (
      actor.role === "parent" &&
      !parsed.data.wholeFamily &&
      memberIds.length === 0
    ) {
      return { error: "Choose whole family or at least one family member." };
    }

    const preview = parseIcsCalendar(await file.text(), {
      fallbackTimeZone: parsed.data.browserTimeZone,
    });
    const selectedUidSet = new Set(parsed.data.selectedUids);
    const events = preview.events.filter(
      (event) => event.status === "ready" && selectedUidSet.has(event.uid),
    );

    if (events.length === 0) {
      return { error: "None of the selected events can be imported." };
    }

    if (events.length > MAX_ICS_IMPORT_EVENTS) {
      return {
        error: `Import at most ${MAX_ICS_IMPORT_EVENTS} events at a time.`,
      };
    }

    let importedCount = 0;
    let duplicateCount = 0;
    const failures: string[] = [];
    const importedEventIds: string[] = [];
    const sourceName = file.name.slice(0, 255);

    for (const event of events) {
      if (!event.startsAt || !event.endsAt) {
        failures.push(`${event.title}: missing a valid start or end.`);
        continue;
      }

      const eventId = crypto.randomUUID();
      const { error } = await actor.writeClient.rpc("import_schedule_event", {
        p_event_id: eventId,
        p_family_id: actor.familyId,
        p_member_ids: memberIds,
        p_created_by_member_id: actor.memberId,
        p_event_type: parsed.data.eventType,
        p_title: event.title,
        p_description: event.description,
        p_starts_at: event.startsAt,
        p_ends_at: event.endsAt,
        p_all_day: event.allDay,
        p_location: event.location,
        p_color: null,
        p_import_uid: event.uid,
        p_import_source_name: sourceName,
        p_recurrence_frequency: event.recurrence?.frequency ?? null,
        p_recurrence_interval: event.recurrence?.interval ?? null,
        p_recurrence_weekdays: event.recurrence?.weekdays ?? [],
        p_recurrence_ends_on: event.recurrence?.endsOn ?? null,
        p_recurrence_occurrence_count:
          event.recurrence?.occurrenceCount ?? null,
        p_time_zone: event.recurrence?.timeZone ?? null,
      });

      if (error?.code === "23505") {
        duplicateCount += 1;
      } else if (error) {
        failures.push(`${event.title}: ${error.message}`);
      } else {
        importedCount += 1;
        importedEventIds.push(eventId);
      }
    }

    if (importedCount > 0) {
      await insertImportAudit({
        actorMemberId: actor.memberId,
        eventIds: importedEventIds,
        familyId: actor.familyId,
        sourceName,
        supabase: actor.writeClient,
      });
      revalidatePath("/dashboard");
      revalidatePath("/schedule");
    }

    const result: IcsImportActionState = {
      importedCount,
      duplicateCount,
      failedCount: failures.length,
    };

    if (failures.length > 0) {
      result.error = `${failures.length} event${failures.length === 1 ? "" : "s"} could not be imported. ${failures[0]}`;
    }

    if (importedCount > 0 || duplicateCount > 0) {
      result.success = `${importedCount} imported${duplicateCount ? `, ${duplicateCount} already existed` : ""}.`;
    }

    return result;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Calendar import failed.",
    };
  }
}

function validateCalendarFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) {
    return "Choose an .ics calendar file.";
  }

  if (!value.name.toLowerCase().endsWith(".ics")) {
    return "Choose a file whose name ends in .ics.";
  }

  if (!acceptedCalendarTypes.has(value.type.toLowerCase())) {
    return "Choose an iCalendar (.ics) file.";
  }

  if (value.size === 0) {
    return "The calendar file is empty.";
  }

  if (value.size > MAX_ICS_FILE_BYTES) {
    return "Calendar files must be 512 KB or smaller.";
  }

  return null;
}

async function insertImportAudit({
  actorMemberId,
  eventIds,
  familyId,
  sourceName,
  supabase,
}: {
  actorMemberId: string;
  eventIds: string[];
  familyId: string;
  sourceName: string;
  supabase: AppSupabaseClient;
}) {
  await supabase.from("audit_events").insert({
    action: "schedule_events.ics_imported",
    actor_member_id: actorMemberId,
    family_id: familyId,
    metadata: {
      event_count: eventIds.length,
      event_ids: eventIds,
      source_name: sourceName,
    },
  });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

function chunks<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, index * size + size),
  );
}

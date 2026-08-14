import ICAL from "ical.js";
import type { ScheduleRecurrence } from "@/features/schedule/types";
import type {
  IcsPreview,
  IcsPreviewEvent,
} from "@/features/schedule/ics/types";
import {
  getZonedDateParts,
  isValidTimeZone,
  type ZonedDateParts,
  zonedDateToUtc,
} from "@/lib/dates/time-zone";

export const MAX_ICS_FILE_BYTES = 512 * 1024;
export const MAX_ICS_EVENTS = 500;
export const MAX_ICS_IMPORT_EVENTS = 100;

const fieldLimits = {
  description: 500,
  location: 160,
  title: 140,
  uid: 500,
};

const weekdayNumbers: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

type ParseOptions = {
  fallbackTimeZone: string;
};

type TimeResult = {
  date: Date;
  timeZone: string;
};

export function parseIcsCalendar(
  source: string,
  { fallbackTimeZone }: ParseOptions,
): IcsPreview {
  if (new TextEncoder().encode(source).byteLength > MAX_ICS_FILE_BYTES) {
    throw new Error("Calendar files must be 512 KB or smaller.");
  }

  if (!source.trim()) {
    throw new Error("The calendar file is empty.");
  }

  if (!isValidTimeZone(fallbackTimeZone)) {
    throw new Error("The browser time zone is not valid.");
  }

  let calendar: InstanceType<typeof ICAL.Component>;

  try {
    calendar = new ICAL.Component(ICAL.parse(source));
  } catch {
    throw new Error("The file is not valid iCalendar data.");
  }

  if (calendar.name !== "vcalendar") {
    throw new Error("The file does not contain an iCalendar calendar.");
  }

  const components = calendar.getAllSubcomponents("vevent");

  if (components.length === 0) {
    throw new Error("The calendar file does not contain any events.");
  }

  if (components.length > MAX_ICS_EVENTS) {
    throw new Error(
      `Calendar files can contain at most ${MAX_ICS_EVENTS} events.`,
    );
  }

  const seenUids = new Set<string>();
  const events = components.map((component) => {
    let event: IcsPreviewEvent;

    try {
      event = parseEvent(component, fallbackTimeZone);
    } catch (error) {
      event = unsupportedEvent(component, error);
    }

    if (event.uid && seenUids.has(event.uid)) {
      if (event.status === "ready") {
        event.status = "duplicate";
      }
      event.reasons.push("This UID appears more than once in the file.");
    } else if (event.uid) {
      seenUids.add(event.uid);
    }

    return event;
  });

  return summarizePreview(events);
}

function parseEvent(
  component: InstanceType<typeof ICAL.Component>,
  fallbackTimeZone: string,
): IcsPreviewEvent {
  const icalEvent = new ICAL.Event(component);
  const reasons: string[] = [];
  const warnings: string[] = [];
  const rawUid = normalizeText(icalEvent.uid);
  const uid = limitField(rawUid, fieldLimits.uid, "UID", reasons);
  const title = limitField(
    normalizeText(icalEvent.summary) || "Untitled event",
    fieldLimits.title,
    "Title",
    warnings,
  );
  const description = optionalLimitedField(
    icalEvent.description,
    fieldLimits.description,
    "Notes",
    warnings,
  );
  const location = optionalLimitedField(
    icalEvent.location,
    fieldLimits.location,
    "Location",
    warnings,
  );
  const startProperty = component.getFirstProperty("dtstart");
  let startsAt: string | null = null;
  let endsAt: string | null = null;
  let allDay = false;
  let timeZone: string | null = null;

  if (!uid) {
    reasons.push("The event is missing a UID.");
  }

  if (component.getFirstProperty("recurrence-id")) {
    reasons.push(
      "Single-occurrence recurrence exceptions are not supported yet.",
    );
  }

  if (!startProperty) {
    reasons.push("The event is missing DTSTART.");
  } else {
    const start = startProperty.getFirstValue();

    if (!(start instanceof ICAL.Time)) {
      reasons.push("The event start is not a supported date or time.");
    } else {
      allDay = start.isDate;

      try {
        const startResult = convertTime(start, startProperty, fallbackTimeZone);
        startsAt = startResult.date.toISOString();
        timeZone = startResult.timeZone;
        const endProperty = component.getFirstProperty("dtend");
        const durationProperty = component.getFirstProperty("duration");

        if (endProperty && durationProperty) {
          reasons.push("An event cannot contain both DTEND and DURATION.");
        }

        if (endProperty) {
          const end = endProperty.getFirstValue();

          if (!(end instanceof ICAL.Time)) {
            reasons.push("The event end is not a supported date or time.");
          } else if (end.isDate !== allDay) {
            reasons.push("DTSTART and DTEND must use matching value types.");
          } else {
            endsAt = convertTime(
              end,
              endProperty,
              allDay ? fallbackTimeZone : timeZone,
            ).date.toISOString();
          }
        } else if (durationProperty) {
          const duration = durationProperty.getFirstValue();

          if (
            !(duration instanceof ICAL.Duration) ||
            duration.toSeconds() <= 0
          ) {
            reasons.push("The event duration must be positive.");
          } else {
            endsAt = new Date(
              startResult.date.getTime() + duration.toSeconds() * 1000,
            ).toISOString();
          }
        } else {
          endsAt = allDay
            ? addLocalDays(
                startResult.date,
                startResult.timeZone,
                1,
              ).toISOString()
            : new Date(
                startResult.date.getTime() + 60 * 60 * 1000,
              ).toISOString();
          warnings.push(
            allDay
              ? "No end was provided; one day will be used."
              : "No end was provided; one hour will be used.",
          );
        }
      } catch (error) {
        reasons.push(
          error instanceof Error ? error.message : "Invalid event time.",
        );
      }
    }
  }

  if (
    startsAt &&
    endsAt &&
    new Date(endsAt).getTime() <= new Date(startsAt).getTime()
  ) {
    reasons.push("The event end must be after its start.");
  }

  const recurrence = parseRecurrence(component, timeZone, reasons);

  if (
    component.getFirstProperty("exdate") ||
    component.getFirstProperty("rdate") ||
    component.getFirstProperty("exrule")
  ) {
    reasons.push("EXDATE, RDATE, and EXRULE changes are not supported yet.");
  }

  if (
    normalizeText(component.getFirstPropertyValue("status")).toUpperCase() ===
    "CANCELLED"
  ) {
    reasons.push("Cancelled events are not imported.");
  }

  return {
    uid,
    title,
    description,
    location,
    startsAt,
    endsAt,
    allDay,
    timeZone,
    recurrence,
    status: reasons.length === 0 ? "ready" : "unsupported",
    reasons,
    warnings,
  };
}

function convertTime(
  time: InstanceType<typeof ICAL.Time>,
  property: InstanceType<typeof ICAL.Property>,
  fallbackTimeZone: string,
): TimeResult {
  const parameter = property.getFirstParameter("tzid");
  const zoneId = normalizeText(
    typeof parameter === "string" ? parameter : time.zone?.tzid,
  );
  const isUtc =
    zoneId.toUpperCase() === "UTC" || time.zone === ICAL.Timezone.utcTimezone;
  const timeZone = time.isDate
    ? fallbackTimeZone
    : isUtc
      ? "UTC"
      : zoneId && zoneId !== "floating"
        ? zoneId
        : fallbackTimeZone;

  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Time zone “${timeZone}” is not supported.`);
  }

  const parts = timeParts(time);
  const date = isUtc
    ? new Date(
        Date.UTC(
          parts.year,
          parts.month - 1,
          parts.day,
          parts.hour,
          parts.minute,
          parts.second,
        ),
      )
    : zonedDateToUtc(parts, timeZone);

  return { date, timeZone };
}

function parseRecurrence(
  component: InstanceType<typeof ICAL.Component>,
  timeZone: string | null,
  reasons: string[],
): ScheduleRecurrence | null {
  const rules = component.getAllProperties("rrule");

  if (rules.length === 0) {
    return null;
  }

  if (rules.length > 1) {
    reasons.push("Multiple RRULE values are not supported.");
    return null;
  }

  const rule = rules[0]?.getFirstValue();

  if (!(rule instanceof ICAL.Recur)) {
    reasons.push("The recurrence rule is invalid.");
    return null;
  }

  const frequency = normalizeText(rule.freq).toLowerCase();

  if (!(["daily", "weekly", "yearly"] as string[]).includes(frequency)) {
    reasons.push(
      frequency
        ? `Recurring frequency ${rule.freq} is not supported.`
        : "The recurrence rule is missing FREQ.",
    );
    return null;
  }

  const unsupportedParts = Object.keys(rule.parts).filter(
    (part) => part !== "BYDAY",
  );

  if (unsupportedParts.length > 0) {
    reasons.push(
      `Recurrence parts ${unsupportedParts.join(", ")} are not supported.`,
    );
  }

  const byDay = rule.parts.BYDAY ?? [];

  if (frequency !== "weekly" && byDay.length > 0) {
    reasons.push("BYDAY is supported only with weekly recurrence.");
  }

  if (byDay.some((day) => weekdayNumbers[day] === undefined)) {
    reasons.push("Ordinal or invalid BYDAY values are not supported.");
  }

  if (frequency === "weekly" && rule.interval > 1 && byDay.length > 1) {
    reasons.push(
      "Multi-week recurrence with several weekdays cannot be mapped safely.",
    );
  }

  if (rule.interval < 1 || rule.interval > 365) {
    reasons.push("The recurrence interval must be between 1 and 365.");
  }

  if (rule.count && (rule.count < 1 || rule.count > 1000)) {
    reasons.push("The recurrence count must be between 1 and 1,000.");
  }

  if (rule.count && rule.until) {
    reasons.push("A recurrence cannot contain both COUNT and UNTIL.");
  }

  const endsOn = rule.until
    ? recurrenceEndDate(rule.until, timeZone ?? "UTC")
    : null;

  return {
    frequency: frequency as ScheduleRecurrence["frequency"],
    interval: rule.interval,
    weekdays:
      frequency === "weekly" ? byDay.map((day) => weekdayNumbers[day]) : [],
    endsOn,
    occurrenceCount: rule.count,
    timeZone: timeZone ?? "UTC",
  };
}

function recurrenceEndDate(
  until: InstanceType<typeof ICAL.Time>,
  timeZone: string,
) {
  if (until.isDate) {
    return dateKey(timeParts(until));
  }

  const parts = timeParts(until);
  const isUtc =
    until.zone?.tzid?.toUpperCase() === "UTC" ||
    until.zone === ICAL.Timezone.utcTimezone;
  const utcDate = isUtc
    ? new Date(
        Date.UTC(
          parts.year,
          parts.month - 1,
          parts.day,
          parts.hour,
          parts.minute,
          parts.second,
        ),
      )
    : zonedDateToUtc(parts, timeZone);
  return dateKey(getZonedDateParts(utcDate, timeZone));
}

function addLocalDays(date: Date, timeZone: string, days: number) {
  const parts = getZonedDateParts(date, timeZone);
  const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  localDate.setUTCDate(localDate.getUTCDate() + days);

  return zonedDateToUtc(
    {
      year: localDate.getUTCFullYear(),
      month: localDate.getUTCMonth() + 1,
      day: localDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

function timeParts(time: InstanceType<typeof ICAL.Time>): ZonedDateParts {
  return {
    year: time.year,
    month: time.month,
    day: time.day,
    hour: time.isDate ? 0 : time.hour,
    minute: time.isDate ? 0 : time.minute,
    second: time.isDate ? 0 : time.second,
  };
}

function dateKey(parts: Pick<ZonedDateParts, "year" | "month" | "day">) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function limitField(
  value: string,
  maxLength: number,
  label: string,
  messages: string[],
) {
  if (value.length <= maxLength) {
    return value;
  }

  messages.push(`${label} exceeds ${maxLength} characters.`);
  return value.slice(0, maxLength);
}

function optionalLimitedField(
  value: unknown,
  maxLength: number,
  label: string,
  warnings: string[],
) {
  const normalized = normalizeText(value);
  return normalized ? limitField(normalized, maxLength, label, warnings) : null;
}

function unsupportedEvent(
  component: InstanceType<typeof ICAL.Component>,
  error: unknown,
): IcsPreviewEvent {
  let uid = "";
  let title = "Unsupported event";

  try {
    uid = normalizeText(component.getFirstPropertyValue("uid")).slice(
      0,
      fieldLimits.uid,
    );
    title =
      normalizeText(component.getFirstPropertyValue("summary")).slice(
        0,
        fieldLimits.title,
      ) || title;
  } catch {
    // The per-event reason below is enough when malformed values cannot be read.
  }

  return {
    uid,
    title,
    description: null,
    location: null,
    startsAt: null,
    endsAt: null,
    allDay: false,
    timeZone: null,
    recurrence: null,
    status: "unsupported",
    reasons: [
      error instanceof Error
        ? `This event could not be parsed: ${error.message}`
        : "This event could not be parsed.",
    ],
    warnings: [],
  };
}

function summarizePreview(events: IcsPreviewEvent[]): IcsPreview {
  return {
    events,
    readyCount: events.filter((event) => event.status === "ready").length,
    duplicateCount: events.filter((event) => event.status === "duplicate")
      .length,
    unsupportedCount: events.filter((event) => event.status === "unsupported")
      .length,
  };
}

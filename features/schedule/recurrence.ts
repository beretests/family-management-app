import type {
  ScheduleEvent,
  ScheduleOccurrenceOverride,
  ScheduleRecurrence,
} from "@/features/schedule/types";
import {
  getZonedDateParts,
  type ZonedDateParts,
  zonedDateToUtc,
} from "@/lib/dates/time-zone";

const dayMilliseconds = 24 * 60 * 60 * 1000;
const maxCandidateDays = 366 * 100;

function dateKey(parts: Pick<ZonedDateParts, "year" | "month" | "day">) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

function localDay(parts: Pick<ZonedDateParts, "year" | "month" | "day">) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function isValidLocalDate(date: Date, anchor: ZonedDateParts) {
  return (
    date.getUTCMonth() === anchor.month - 1 && date.getUTCDate() === anchor.day
  );
}

function matchesRule({
  anchor,
  candidate,
  recurrence,
}: {
  anchor: ZonedDateParts;
  candidate: Date;
  recurrence: ScheduleRecurrence;
}) {
  const anchorDate = localDay(anchor);
  const differenceDays = Math.floor(
    (candidate.getTime() - anchorDate.getTime()) / dayMilliseconds,
  );

  if (differenceDays < 0) {
    return false;
  }

  if (recurrence.frequency === "daily") {
    return differenceDays % recurrence.interval === 0;
  }

  if (recurrence.frequency === "weekly") {
    const weekdays = recurrence.weekdays.length
      ? recurrence.weekdays
      : [anchorDate.getUTCDay()];
    return (
      Math.floor(differenceDays / 7) % recurrence.interval === 0 &&
      weekdays.includes(candidate.getUTCDay())
    );
  }

  const years = candidate.getUTCFullYear() - anchor.year;
  return (
    years >= 0 &&
    years % recurrence.interval === 0 &&
    candidate.getUTCMonth() === anchor.month - 1 &&
    candidate.getUTCDate() === anchor.day &&
    isValidLocalDate(candidate, anchor)
  );
}

export function getRecurrenceOccurrenceNumber({
  occurrenceDate,
  recurrence,
  seriesStartsAt,
}: {
  occurrenceDate: string;
  recurrence: ScheduleRecurrence;
  seriesStartsAt: string;
}) {
  if (recurrence.endsOn && occurrenceDate > recurrence.endsOn) {
    return null;
  }

  const anchor = getZonedDateParts(
    new Date(seriesStartsAt),
    recurrence.timeZone,
  );
  const anchorDate = localDay(anchor);
  const target = new Date(`${occurrenceDate}T00:00:00.000Z`);
  const differenceDays =
    (target.getTime() - anchorDate.getTime()) / dayMilliseconds;

  if (differenceDays < 0 || differenceDays > maxCandidateDays) {
    return null;
  }

  let occurrenceNumber = 0;

  for (
    let candidate = new Date(anchorDate);
    candidate <= target;
    candidate = new Date(candidate.getTime() + dayMilliseconds)
  ) {
    if (!matchesRule({ anchor, candidate, recurrence })) {
      continue;
    }

    occurrenceNumber += 1;

    if (
      recurrence.occurrenceCount &&
      occurrenceNumber > recurrence.occurrenceCount
    ) {
      return null;
    }

    if (
      dateKey({
        year: candidate.getUTCFullYear(),
        month: candidate.getUTCMonth() + 1,
        day: candidate.getUTCDate(),
      }) === occurrenceDate
    ) {
      return occurrenceNumber;
    }
  }

  return null;
}

export function expandRecurringEvent(
  event: ScheduleEvent,
  rangeStartsAt: Date,
  rangeEndsAt: Date,
  overrides: ScheduleOccurrenceOverride[] = [],
) {
  const recurrence = event.recurrence;

  if (!recurrence) {
    return new Date(event.startsAt) < rangeEndsAt &&
      new Date(event.endsAt) > rangeStartsAt
      ? [event]
      : [];
  }

  const baseStart = new Date(event.startsAt);
  const duration = new Date(event.endsAt).getTime() - baseStart.getTime();
  const anchor = getZonedDateParts(baseStart, recurrence.timeZone);
  const anchorDate = localDay(anchor);
  const lastRangeDay = localDay(
    getZonedDateParts(rangeEndsAt, recurrence.timeZone),
  );
  const occurrences: ScheduleEvent[] = [];
  const overridesByDate = new Map(
    overrides.map((override) => [override.occurrenceDate, override]),
  );
  const seenOverrideIds = new Set<string>();
  let occurrenceNumber = 0;

  for (
    let candidate = new Date(anchorDate);
    candidate <= lastRangeDay;
    candidate = new Date(candidate.getTime() + dayMilliseconds)
  ) {
    if (
      (candidate.getTime() - anchorDate.getTime()) / dayMilliseconds >
      maxCandidateDays
    ) {
      break;
    }

    if (!matchesRule({ anchor, candidate, recurrence })) {
      continue;
    }

    occurrenceNumber += 1;
    const candidateParts = {
      year: candidate.getUTCFullYear(),
      month: candidate.getUTCMonth() + 1,
      day: candidate.getUTCDate(),
      hour: anchor.hour,
      minute: anchor.minute,
      second: anchor.second,
    };

    if (recurrence.endsOn && dateKey(candidateParts) > recurrence.endsOn) {
      break;
    }

    if (
      recurrence.occurrenceCount &&
      occurrenceNumber > recurrence.occurrenceCount
    ) {
      break;
    }

    const occurrenceStart = zonedDateToUtc(candidateParts, recurrence.timeZone);
    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
    const occurrenceDate = dateKey(candidateParts);
    const override = overridesByDate.get(occurrenceDate);

    if (override) {
      seenOverrideIds.add(override.id);
    }

    if (override?.status === "cancelled") {
      continue;
    }

    const occurrence = override
      ? applyOccurrenceOverride(event, override)
      : {
          ...event,
          startsAt: occurrenceStart.toISOString(),
          endsAt: occurrenceEnd.toISOString(),
        };

    if (
      new Date(occurrence.startsAt) < rangeEndsAt &&
      new Date(occurrence.endsAt) > rangeStartsAt
    ) {
      occurrences.push({
        ...occurrence,
        id: `${event.id}:${occurrenceStart.toISOString()}`,
        sourceEventId: event.id,
        occurrenceDate,
        occurrenceOverrideId: override?.id,
        seriesStartsAt: event.startsAt,
        seriesEndsAt: event.endsAt,
      });
    }
  }

  for (const override of overrides) {
    if (
      override.status !== "modified" ||
      seenOverrideIds.has(override.id) ||
      !override.startsAt ||
      !override.endsAt
    ) {
      continue;
    }

    if (
      new Date(override.startsAt) < rangeEndsAt &&
      new Date(override.endsAt) > rangeStartsAt
    ) {
      occurrences.push({
        ...applyOccurrenceOverride(event, override),
        id: `${event.id}:${override.occurrenceDate}`,
        sourceEventId: event.id,
        occurrenceDate: override.occurrenceDate,
        occurrenceOverrideId: override.id,
        seriesStartsAt: event.startsAt,
        seriesEndsAt: event.endsAt,
      });
    }
  }

  return occurrences;
}

function applyOccurrenceOverride(
  event: ScheduleEvent,
  override: ScheduleOccurrenceOverride,
): ScheduleEvent {
  return {
    ...event,
    memberIds: override.memberIds,
    memberId: override.memberIds[0] ?? null,
    eventType: override.eventType ?? event.eventType,
    title: override.title ?? event.title,
    description: override.description,
    startsAt: override.startsAt ?? event.startsAt,
    endsAt: override.endsAt ?? event.endsAt,
    allDay: override.allDay ?? event.allDay,
    location: override.location,
    color: override.color,
    updatedAt: override.updatedAt,
  };
}

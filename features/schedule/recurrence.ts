import type {
  ScheduleEvent,
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

export function expandRecurringEvent(
  event: ScheduleEvent,
  rangeStartsAt: Date,
  rangeEndsAt: Date,
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

    if (occurrenceStart < rangeEndsAt && occurrenceEnd > rangeStartsAt) {
      occurrences.push({
        ...event,
        id: `${event.id}:${occurrenceStart.toISOString()}`,
        sourceEventId: event.id,
        seriesStartsAt: event.startsAt,
        seriesEndsAt: event.endsAt,
        startsAt: occurrenceStart.toISOString(),
        endsAt: occurrenceEnd.toISOString(),
      });
    }
  }

  return occurrences;
}

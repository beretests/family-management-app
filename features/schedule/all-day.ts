import { dateTimeLocalToIso } from "@/lib/dates/schedule";
import { zonedDateKey } from "@/lib/dates/time-zone";

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function addDaysToDateKey(dateKey: string, days: number) {
  if (!dateKeyPattern.test(dateKey)) {
    return dateKey;
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function normalizeAllDayFormRange(startsAt: string, endsAt: string) {
  const startsOn = startsAt.slice(0, 10);
  let endsBefore = endsAt.slice(0, 10);

  if (!dateKeyPattern.test(startsOn) || !dateKeyPattern.test(endsBefore)) {
    return { startsAt, endsAt };
  }

  if (endsBefore <= startsOn) {
    endsBefore = addDaysToDateKey(startsOn, 1);
  }

  return {
    startsAt: `${startsOn}T00:00`,
    endsAt: `${endsBefore}T00:00`,
  };
}

export function normalizeImportedNoSchoolRange({
  allDay,
  endsAt,
  startsAt,
  timeZone,
}: {
  allDay: boolean;
  endsAt: string;
  startsAt: string;
  timeZone: string;
}) {
  const startsOn = zonedDateKey(startsAt, timeZone);
  let endsBefore = allDay
    ? zonedDateKey(endsAt, timeZone)
    : addDaysToDateKey(startsOn, 1);

  if (endsBefore <= startsOn) {
    endsBefore = addDaysToDateKey(startsOn, 1);
  }

  return {
    startsAt: dateTimeLocalToIso(`${startsOn}T00:00`, timeZone),
    endsAt: dateTimeLocalToIso(`${endsBefore}T00:00`, timeZone),
  };
}

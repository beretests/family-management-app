import { isValidCalendarDate } from "@/lib/dates/schedule";

export function isValidLocalDateTime(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  return Boolean(
    match &&
    isValidCalendarDate(match[1]) &&
    Number(match[2]) < 24 &&
    Number(match[3]) < 60 &&
    Number(match[4] ?? 0) < 60,
  );
}

export function scheduleRangeError(startsAt: string, endsAt: string) {
  if (!isValidLocalDateTime(startsAt) || !isValidLocalDateTime(endsAt)) {
    return "Enter valid start and end dates and times.";
  }
  // Compare wall-clock values without applying the machine's time zone.
  if (Date.parse(`${endsAt}Z`) <= Date.parse(`${startsAt}Z`)) {
    return "End time must be after start time.";
  }
  return undefined;
}

export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getZonedDateParts(
  date: Date,
  timeZone: string,
): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

export function zonedDateToUtc(parts: ZonedDateParts, timeZone: string) {
  const desired = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let result = new Date(desired);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedDateParts(result, timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    result = new Date(result.getTime() + desired - actualAsUtc);
  }

  return result;
}

export function dateTimeLocalToUtc(value: string, timeZone: string) {
  if (!isValidTimeZone(timeZone)) {
    throw new Error("Choose a valid time zone.");
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    throw new Error("Choose a valid date and time.");
  }

  return zonedDateToUtc(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] ?? 0),
    },
    timeZone,
  );
}

export function formatZonedDateTimeLocal(
  value: string | Date,
  timeZone: string,
) {
  const parts = getZonedDateParts(
    typeof value === "string" ? new Date(value) : value,
    timeZone,
  );

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(
    parts.minute,
  ).padStart(2, "0")}`;
}

export function zonedDateKey(value: string | Date, timeZone: string) {
  const parts = getZonedDateParts(
    typeof value === "string" ? new Date(value) : value,
    timeZone,
  );

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

export function startOfZonedDay(dateKey: string, timeZone: string) {
  return dateTimeLocalToUtc(`${dateKey}T00:00`, timeZone);
}

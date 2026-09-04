import {
  dateTimeLocalToUtc,
  formatZonedDateTimeLocal,
  getZonedDateParts,
} from "@/lib/dates/time-zone";

const dateParamPattern = /^\d{4}-\d{2}-\d{2}$/;

type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

function getCalendarDateParts(dateKey: string): CalendarDateParts | null {
  if (!dateParamPattern.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function calendarDateAsUtcNoon(dateKey: string) {
  const parts = getCalendarDateParts(dateKey);

  if (!parts) {
    throw new Error("Choose a valid calendar date.");
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function isValidCalendarDate(dateKey: string) {
  return getCalendarDateParts(dateKey) !== null;
}

export function resolveCalendarDate(
  value: string | string[] | undefined,
  fallbackDateKey: string,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && isValidCalendarDate(candidate)
    ? candidate
    : fallbackDateKey;
}

export function addCalendarDays(dateKey: string, days: number) {
  const date = calendarDateAsUtcNoon(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calendarWeekday(dateKey: string) {
  return calendarDateAsUtcNoon(dateKey).getUTCDay();
}

export function startOfCalendarWeek(dateKey: string) {
  return addCalendarDays(dateKey, -calendarWeekday(dateKey));
}

export function endOfCalendarWeek(dateKey: string) {
  return addCalendarDays(startOfCalendarWeek(dateKey), 6);
}

export function formatCalendarShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(calendarDateAsUtcNoon(dateKey));
}

export function formatCalendarWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(calendarDateAsUtcNoon(dateKey));
}

export function formatCalendarDateHeading(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(calendarDateAsUtcNoon(dateKey));
}

export function toDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !dateParamPattern.test(candidate)) {
    return new Date();
  }

  const [year, month, day] = candidate.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return new Date();
  }

  return parsed;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

export function endOfWeek(date: Date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export function formatDateHeading(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTimeRange(
  startsAt: string,
  endsAt: string,
  allDay: boolean,
  timeZone?: string,
) {
  if (allDay) {
    return "All day";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(
    new Date(endsAt),
  )}`;
}

export function toDateTimeLocalValue(value?: string | null, timeZone?: string) {
  if (value && timeZone) {
    return formatZonedDateTimeLocal(value, timeZone);
  }

  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function dateTimeLocalToIso(value: string, timeZone?: string) {
  return timeZone
    ? dateTimeLocalToUtc(value, timeZone).toISOString()
    : new Date(value).toISOString();
}

export function zonedDateParam(date: Date, timeZone: string) {
  const parts = getZonedDateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

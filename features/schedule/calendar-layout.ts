import type { ScheduleEvent } from "@/features/schedule/types";
import { dateTimeLocalToUtc, getZonedDateParts } from "@/lib/dates/time-zone";
import { toDateParam } from "@/lib/dates/schedule";

export const calendarDefaultStartHour = 6;
export const calendarDefaultEndHour = 22;
export const calendarHourHeight = 60;

export type CalendarHourRange = {
  startHour: number;
  endHour: number;
};

export type CalendarEventLayout = {
  event: ScheduleEvent;
  top: number;
  height: number;
  left: number;
  width: number;
};

type PositionedEvent = {
  event: ScheduleEvent;
  startsAt: number;
  endsAt: number;
  top: number;
  height: number;
  column: number;
};

const millisecondsPerHour = 60 * 60 * 1000;

export function getCalendarHourRange(
  events: ScheduleEvent[],
  timeZone?: string,
): CalendarHourRange {
  let startHour = calendarDefaultStartHour;
  let endHour = calendarDefaultEndHour;

  for (const event of events) {
    if (event.allDay) {
      continue;
    }

    const startsAt = new Date(event.startsAt);
    const endsAt = new Date(event.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      continue;
    }

    const startParts = timeZone
      ? getZonedDateParts(startsAt, timeZone)
      : {
          hour: startsAt.getHours(),
          minute: startsAt.getMinutes(),
          second: startsAt.getSeconds(),
        };
    const endParts = timeZone
      ? getZonedDateParts(endsAt, timeZone)
      : {
          hour: endsAt.getHours(),
          minute: endsAt.getMinutes(),
          second: endsAt.getSeconds(),
        };

    startHour = Math.min(startHour, startParts.hour, endParts.hour);
    endHour = Math.max(
      endHour,
      startParts.hour + 1,
      endParts.minute > 0 || endParts.second > 0
        ? endParts.hour + 1
        : endParts.hour,
    );
  }

  return {
    startHour: Math.max(0, startHour),
    endHour: Math.min(24, Math.max(startHour + 1, endHour)),
  };
}

export function layoutCalendarEventsForDay({
  day,
  endHour,
  events,
  hourHeight = calendarHourHeight,
  startHour,
  timeZone,
}: {
  day: Date;
  endHour: number;
  events: ScheduleEvent[];
  hourHeight?: number;
  startHour: number;
  timeZone?: string;
}): CalendarEventLayout[] {
  const rangeStart = atHour(day, startHour, timeZone).getTime();
  const rangeEnd = atHour(day, endHour, timeZone).getTime();

  const positioned = events
    .filter((event) => !event.allDay)
    .map((event): PositionedEvent | null => {
      const eventStart = new Date(event.startsAt).getTime();
      const eventEnd = new Date(event.endsAt).getTime();
      const startsAt = Math.max(eventStart, rangeStart);
      const endsAt = Math.min(eventEnd, rangeEnd);

      if (
        Number.isNaN(eventStart) ||
        Number.isNaN(eventEnd) ||
        startsAt >= endsAt
      ) {
        return null;
      }

      const top = ((startsAt - rangeStart) / millisecondsPerHour) * hourHeight;
      const naturalHeight =
        ((endsAt - startsAt) / millisecondsPerHour) * hourHeight;
      const availableHeight =
        ((rangeEnd - startsAt) / millisecondsPerHour) * hourHeight;
      const height = Math.min(availableHeight, Math.max(30, naturalHeight));
      const visualEndsAt = Math.min(
        rangeEnd,
        startsAt + (height / hourHeight) * millisecondsPerHour,
      );

      return {
        event,
        startsAt,
        endsAt: visualEndsAt,
        top,
        height,
        column: 0,
      };
    })
    .filter((event): event is PositionedEvent => event !== null)
    .sort(
      (left, right) =>
        left.startsAt - right.startsAt || right.endsAt - left.endsAt,
    );

  return splitIntoOverlapGroups(positioned).flatMap((group) => {
    const columnEnds: number[] = [];

    for (const event of group) {
      const availableColumn = columnEnds.findIndex(
        (columnEnd) => columnEnd <= event.startsAt,
      );
      event.column =
        availableColumn === -1 ? columnEnds.length : availableColumn;
      columnEnds[event.column] = event.endsAt;
    }

    const columnCount = Math.max(1, columnEnds.length);
    const width = 100 / columnCount;

    return group.map((event) => ({
      event: event.event,
      top: event.top,
      height: event.height,
      left: event.column * width,
      width,
    }));
  });
}

function splitIntoOverlapGroups(events: PositionedEvent[]) {
  const groups: PositionedEvent[][] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;

  for (const event of events) {
    if (groups.length === 0 || event.startsAt >= groupEnd) {
      groups.push([event]);
      groupEnd = event.endsAt;
      continue;
    }

    groups.at(-1)?.push(event);
    groupEnd = Math.max(groupEnd, event.endsAt);
  }

  return groups;
}

function atHour(day: Date, hour: number, timeZone?: string) {
  if (timeZone) {
    const dateKey = toDateParam(day);

    if (hour === 24) {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return dateTimeLocalToUtc(`${toDateParam(nextDay)}T00:00`, timeZone);
    }

    return dateTimeLocalToUtc(
      `${dateKey}T${String(hour).padStart(2, "0")}:00`,
      timeZone,
    );
  }

  if (hour === 24) {
    return new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate() + 1,
      0,
      0,
      0,
      0,
    );
  }

  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hour,
    0,
    0,
    0,
  );
}

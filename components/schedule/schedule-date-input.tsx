"use client";

import { useEffect, useId, useRef } from "react";
import { isValidLocalDateTime } from "@/features/schedule/date-input";
import { isValidCalendarDate } from "@/lib/dates/schedule";

export function ScheduleDateInput({
  label,
  name,
  value,
  onChange,
  textEntry,
  dateOnly = false,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  textEntry: boolean;
  dateOnly?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const format = dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm";
  const valid = dateOnly
    ? isValidCalendarDate(value)
    : isValidLocalDateTime(value);
  const error = valid
    ? ""
    : `Enter a valid ${dateOnly ? "date" : "date and time"} (${format}).`;

  useEffect(() => {
    input.current?.setCustomValidity(error);
  }, [error]);

  return (
    <div className="min-w-0 grid gap-2 text-sm">
      <label className="font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        ref={input}
        name={name}
        required
        className="min-h-11 w-full min-w-0 rounded-md border border-[var(--line)] px-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        type={textEntry ? "text" : dateOnly ? "date" : "datetime-local"}
        step={dateOnly || textEntry ? undefined : 1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={textEntry ? format : undefined}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={!valid}
        aria-describedby={`${id}-help`}
      />
      <span
        id={`${id}-help`}
        className={
          error ? "text-[var(--warning)]" : "text-xs text-[var(--muted)]"
        }
      >
        {error ||
          (textEntry ? `${format}${dateOnly ? "" : " · 24-hour time"}` : "")}
      </span>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  pastedIcsSource,
  readIcsSource,
  type IcsSource,
} from "@/features/schedule/ics/source";

export function IcsSourceInput({
  onChange,
  disabled,
}: {
  onChange: (source: IcsSource | null) => void;
  disabled: boolean;
}) {
  const sourceId = useId();
  const [mode, setMode] = useState("file");
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState(false);
  const revision = useRef(0);

  useEffect(
    () => () => {
      revision.current += 1;
    },
    [],
  );

  function reset() {
    revision.current += 1;
    onChange(null);
    setError(undefined);
    setReading(false);
  }

  function changeText(value: string) {
    reset();
    setText(value);
    if (!value) return;
    try {
      onChange(pastedIcsSource(value));
    } catch (error) {
      setError((error as Error).message);
    }
  }

  async function changeFile(file?: File) {
    reset();
    if (!file) return;
    const current = revision.current;
    setReading(true);
    try {
      const source = await readIcsSource(file);
      if (current === revision.current) onChange(source);
    } catch (error) {
      if (current === revision.current) setError((error as Error).message);
    } finally {
      if (current === revision.current) setReading(false);
    }
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 grid gap-3">
      <div className="grid gap-2 text-sm font-medium">
        <label htmlFor={sourceId}>Calendar source</label>
        <select
          id={sourceId}
          className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
          value={mode}
          onChange={(event) => {
            reset();
            setText("");
            setMode(event.target.value);
          }}
        >
          <option value="file">Upload file</option>
          <option value="text">Paste calendar text</option>
        </select>
      </div>
      {mode === "file" ? (
        <label className="grid gap-2 text-sm font-medium">
          iCalendar file
          <input
            accept=".ics,text/calendar"
            type="file"
            className="min-h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-white px-2 py-2 text-sm"
            onChange={(event) => {
              void changeFile(event.target.files?.[0]);
              // The bytes are captured above; clearing permits retrying the same file.
              event.target.value = "";
            }}
          />
        </label>
      ) : (
        <label className="grid gap-2 text-sm font-medium">
          Calendar text
          <textarea
            className="min-h-36 min-w-0 rounded-md border border-[var(--line)] p-3 font-mono text-sm"
            value={text}
            onChange={(event) => changeText(event.target.value)}
            placeholder="BEGIN:VCALENDAR"
            spellCheck={false}
          />
        </label>
      )}
      <p className="text-xs text-[var(--muted)]">
        Maximum 512 KB and 500 events. Calendar contents stay in memory and are
        not stored as a file.
      </p>
      {reading ? <p role="status">Reading calendar file...</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-[var(--warning)]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

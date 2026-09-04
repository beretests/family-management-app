"use client";

import { useEffect } from "react";

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-xl border border-[var(--warning)] bg-[var(--warning-soft)] p-5">
      <h1 className="text-xl font-extrabold text-[var(--foreground)]">
        The calendar could not refresh
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
        Your last change may already be saved. It is safe to retry because event
        creation uses a unique request identifier.
      </p>
      <button
        className="mt-4 min-h-11 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Retry calendar
      </button>
    </section>
  );
}

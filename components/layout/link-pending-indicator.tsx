"use client";

import { useLinkStatus } from "next/link";

export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full bg-current transition-opacity delay-100 ${
        pending ? "animate-pulse opacity-60" : "opacity-0"
      }`}
    />
  );
}

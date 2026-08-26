"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function CalendarTimeZoneSync({ timeZone }: { timeZone: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const browserTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const nextParams = new URLSearchParams(searchParams.toString());

    if (browserTimeZone !== timeZone) {
      nextParams.set("timeZone", browserTimeZone);
    }

    if (!nextParams.has("date")) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: browserTimeZone,
        year: "numeric",
      }).formatToParts(new Date());
      const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value;
      nextParams.set(
        "date",
        `${value("year")}-${value("month")}-${value("day")}`,
      );
    }

    if (nextParams.toString() === searchParams.toString()) {
      return;
    }

    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, timeZone]);

  return null;
}

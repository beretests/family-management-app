import Link from "next/link";
import type { FamilyMemberWithDetails } from "@/features/family/types";
import { addCalendarDays } from "@/lib/dates/schedule";

type CalendarView = "day" | "week";

type ScheduleNavigationState = {
  date: string;
  memberId: string | null;
  timeZone: string;
  view: CalendarView;
};

const linkClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]";
const activeLinkClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]";

export function CalendarMemberFilter({
  date,
  members,
  selectedMemberId,
  timeZone,
  view,
}: {
  date: string;
  members: FamilyMemberWithDetails[];
  selectedMemberId: string | null;
  timeZone: string;
  view: CalendarView;
}) {
  const memberLinkClass =
    "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)]";
  const activeMemberLinkClass =
    "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm";

  return (
    <nav aria-label="Calendar member filter">
      <form
        action="/schedule"
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:hidden"
        data-testid="calendar-member-select"
        method="get"
      >
        <input name="date" type="hidden" value={date} />
        <input name="view" type="hidden" value={view} />
        <input name="timeZone" type="hidden" value={timeZone} />
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--muted)]">
          Family member
          <select
            className="min-h-11 min-w-0 rounded-md border border-[var(--line)] bg-white px-3 text-base text-[var(--foreground)]"
            defaultValue={selectedMemberId ?? ""}
            name="member"
          >
            <option value="">Whole family</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label="Apply member filter"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
          type="submit"
        >
          Apply
        </button>
      </form>

      <div
        className="hidden max-w-full gap-2 overflow-x-auto pb-1 sm:flex"
        data-testid="calendar-member-links"
      >
        <Link
          aria-current={selectedMemberId === null ? "page" : undefined}
          className={
            selectedMemberId === null ? activeMemberLinkClass : memberLinkClass
          }
          href={getScheduleHref({ date, memberId: null, view, timeZone })}
        >
          Whole family
        </Link>
        {members.map((member) => (
          <Link
            aria-current={selectedMemberId === member.id ? "page" : undefined}
            className={
              selectedMemberId === member.id
                ? activeMemberLinkClass
                : memberLinkClass
            }
            href={getScheduleHref({
              date,
              memberId: member.id,
              view,
              timeZone,
            })}
            key={member.id}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full border border-current"
              style={{ backgroundColor: member.color ?? "#047857" }}
            />
            <span className="min-w-0 break-words">{member.displayName}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function CalendarDateNavigation({
  date,
  memberId,
  timeZone,
  today,
  view,
}: ScheduleNavigationState & { today: string }) {
  const step = view === "week" ? 7 : 1;

  return (
    <nav
      aria-label="Calendar date navigation"
      className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-sm"
    >
      <Link
        className={linkClass}
        href={getScheduleHref({
          date: addCalendarDays(date, -step),
          memberId,
          view,
          timeZone,
        })}
      >
        Previous
      </Link>
      <Link
        className={linkClass}
        href={getScheduleHref({ date: today, memberId, view, timeZone })}
      >
        Today
      </Link>
      <Link
        className={linkClass}
        href={getScheduleHref({
          date: addCalendarDays(date, step),
          memberId,
          view,
          timeZone,
        })}
      >
        Next
      </Link>
    </nav>
  );
}

export function ScheduleViewControls({
  date,
  memberId,
  timeZone,
  view,
}: ScheduleNavigationState) {
  return (
    <div className="grid gap-3 sm:min-w-72">
      <div className="grid grid-cols-2 gap-2">
        <Link
          className={view === "day" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "day", timeZone })}
        >
          Day
        </Link>
        <Link
          className={view === "week" ? activeLinkClass : linkClass}
          href={getScheduleHref({ date, memberId, view: "week", timeZone })}
        >
          Week
        </Link>
      </div>
      <form
        action="/schedule"
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        method="get"
      >
        <input name="view" type="hidden" value={view} />
        <input name="timeZone" type="hidden" value={timeZone} />
        {memberId ? (
          <input name="member" type="hidden" value={memberId} />
        ) : null}
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--muted)]">
          Jump to date
          <input
            className="min-h-10 min-w-0 rounded-md border border-[var(--line)] px-2 text-sm text-[var(--foreground)]"
            defaultValue={date}
            name="date"
            type="date"
          />
        </label>
        <button className={linkClass} type="submit">
          Go
        </button>
      </form>
    </div>
  );
}

export function getScheduleHref({
  date,
  memberId,
  timeZone,
  view,
}: ScheduleNavigationState) {
  const searchParams = new URLSearchParams({
    date,
    view,
    timeZone,
  });

  if (memberId) {
    searchParams.set("member", memberId);
  }

  return `/schedule?${searchParams.toString()}`;
}

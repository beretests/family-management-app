import { signOut } from "@/features/auth/actions";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Gift,
  Home,
  ListChecks,
  LogOut,
  Medal,
  Settings,
  Sparkles,
  TimerReset,
  UsersRound,
} from "lucide-react";
import { ExitKidModeForm } from "@/components/child-session/kid-mode-forms";
import type { FamilyMember } from "@/features/family/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-today", label: "My Today", icon: ListChecks },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/chores", label: "Chores", icon: ClipboardList },
  { href: "/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/reminders", label: "Reminders", icon: TimerReset },
  { href: "/settings/family", label: "Family", icon: Settings },
  { href: "/kid-mode", label: "Kid Mode", icon: UsersRound },
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

const navLinkClass =
  "inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]";

export function AppShell({
  children,
  currentMember,
  email,
}: {
  children: React.ReactNode;
  currentMember?: FamilyMember | null;
  email?: string;
}) {
  const isKidMode = currentMember?.role === "child";

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--accent)] text-white">
                  <Sparkles aria-hidden="true" className="size-5" />
                </span>
                <p className="text-sm font-extrabold uppercase text-[var(--accent-strong)]">
                  Family Chore Hub
                </p>
              </div>
              <p className="mt-1 break-words text-sm text-[var(--muted)]">
                Signed in{email ? ` as ${email}` : ""}
              </p>
              {isKidMode ? (
                <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-[var(--playful-yellow-soft)] px-3 py-1 text-sm font-bold text-[var(--playful-yellow)]">
                  <Sparkles aria-hidden="true" className="size-4" />
                  Kid Mode: {currentMember.displayName}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {isKidMode ? <ExitKidModeForm /> : null}
              <form action={signOut}>
                <button
                  className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)]"
                  type="submit"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <nav
            aria-label="Primary"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {navItems.map((item) => (
              <Link className={navLinkClass} href={item.href} key={item.href}>
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

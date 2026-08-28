"use client";

import { useEffect, useRef, useState } from "react";
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
  Menu,
  ShoppingBasket,
  Settings,
  Sparkles,
  TimerReset,
  UsersRound,
  X,
} from "lucide-react";
import { ExitKidModeForm } from "@/components/child-session/kid-mode-forms";
import { LinkPendingIndicator } from "@/components/layout/link-pending-indicator";
import { signOut } from "@/features/auth/actions";

const fullAppNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-today", label: "My Today", icon: ListChecks },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/groceries", label: "Groceries", icon: ShoppingBasket },
  { href: "/chores", label: "Chores", icon: ClipboardList },
  { href: "/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/reminders", label: "Reminders", icon: TimerReset },
  { href: "/settings/family", label: "Family", icon: Settings },
  { href: "/kid-mode", label: "Kid Mode", icon: UsersRound },
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

const limitedNavItems = [
  { href: "/schedule", label: "Calendar", icon: CalendarDays },
  { href: "/groceries", label: "Groceries", icon: ShoppingBasket },
  { href: "/settings/family", label: "Family", icon: Settings },
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

const navLinkClass =
  "inline-flex min-h-11 w-full items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] sm:min-h-10 sm:w-auto sm:shrink-0 sm:whitespace-nowrap";

export function AppHeader({
  currentMemberName,
  email,
  fullAppEnabled,
  isKidMode,
  isLinkedChild,
  isParent,
}: {
  currentMemberName?: string;
  email?: string;
  fullAppEnabled: boolean;
  isKidMode: boolean;
  isLinkedChild: boolean;
  isParent: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = "primary-navigation-menu";
  const navItems = (fullAppEnabled ? fullAppNavItems : limitedNavItems).filter(
    (item) => item.href !== "/settings/family" || isParent,
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--accent)] text-white">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-extrabold uppercase text-[var(--accent-strong)]">
              {fullAppEnabled ? "Family Chore Hub" : "Family Planner"}
            </p>
          </div>
          <p className="mt-1 break-words text-sm text-[var(--muted)]">
            Signed in{email ? ` as ${email}` : ""}
          </p>
          {isKidMode ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-[var(--playful-yellow-soft)] px-3 py-1 text-sm font-bold text-[var(--playful-yellow)]">
              <Sparkles aria-hidden="true" className="size-4" />
              Kid Mode: {currentMemberName ?? "Child"}
            </p>
          ) : null}
          {isLinkedChild ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-[var(--accent-soft)] px-3 py-1 text-sm font-bold text-[var(--accent-strong)]">
              <Sparkles aria-hidden="true" className="size-4" />
              Child account: {currentMemberName}
            </p>
          ) : null}
        </div>

        <button
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] sm:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          ref={menuButtonRef}
          type="button"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
          {isMenuOpen ? "Close" : "Menu"}
        </button>

        <div
          className={`${isMenuOpen ? "grid" : "hidden"} col-span-2 gap-2 sm:contents`}
          id={menuId}
        >
          <div className="order-2 grid gap-2 sm:col-start-2 sm:row-start-1 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
            {isKidMode ? <ExitKidModeForm /> : null}
            <form action={signOut}>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] sm:min-h-10 sm:w-auto"
                type="submit"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Sign out
              </button>
            </form>
          </div>
          <nav
            aria-label="Primary"
            className="order-1 grid gap-2 sm:col-span-2 sm:row-start-2 sm:flex sm:max-w-full sm:overflow-x-auto sm:pb-1"
          >
            {navItems.map((item) => (
              <Link
                className={navLinkClass}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
                <LinkPendingIndicator />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

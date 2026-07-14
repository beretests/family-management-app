import { signOut } from "@/features/auth/actions";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-today", label: "My Today" },
  { href: "/schedule", label: "Schedule" },
  { href: "/chores", label: "Chores" },
  { href: "/assignments", label: "Assignments" },
  { href: "/approvals", label: "Approvals" },
  { href: "/rewards", label: "Rewards" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/reminders", label: "Reminders" },
  { href: "/settings/family", label: "Family" },
];

const navLinkClass =
  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]";

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
                Family Chore Hub
              </p>
              <p className="mt-1 break-words text-sm text-[var(--muted)]">
                Signed in{email ? ` as ${email}` : ""}
              </p>
            </div>
            <form action={signOut} className="shrink-0">
              <button
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
          <nav
            aria-label="Primary"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {navItems.map((item) => (
              <Link className={navLinkClass} href={item.href} key={item.href}>
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

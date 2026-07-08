import { signOut } from "@/features/auth/actions";
import Link from "next/link";

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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
              Family Chore Hub
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Signed in{email ? ` as ${email}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Primary" className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                href="/settings/family"
              >
                Family
              </Link>
            </nav>
            <form action={signOut}>
              <button
                className="min-h-10 rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                type="submit"
            >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

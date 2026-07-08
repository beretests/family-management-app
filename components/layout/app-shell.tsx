import { signOut } from "@/features/auth/actions";

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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
              Family Chore Hub
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Signed in{email ? ` as ${email}` : ""}
            </p>
          </div>
          <form action={signOut}>
            <button
              className="min-h-10 rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

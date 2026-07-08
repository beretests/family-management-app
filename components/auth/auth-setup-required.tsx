import Link from "next/link";

export function AuthSetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-[var(--warning)]">
          Setup required
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Supabase auth is not configured yet.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`, then restart
          the dev server. Server-only keys stay out of browser code.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            href="/sign-in"
          >
            Back to sign in
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)]"
            href="/"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}

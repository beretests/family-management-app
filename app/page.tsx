import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { getBootstrapReadinessItems } from "@/lib/bootstrap-readiness";

const familyMembers = [
  {
    name: "Ari",
    age: 8,
    color: "bg-emerald-600",
    detail: "Light chores today",
  },
  {
    name: "Ben",
    age: 11,
    color: "bg-blue-600",
    detail: "Free after school",
  },
  {
    name: "Cam",
    age: 14,
    color: "bg-amber-600",
    detail: "Soccer at 6:00 PM",
  },
];

const scheduleItems = [
  {
    time: "4:00 PM",
    title: "Sweep kitchen",
    owner: "Ari",
    tone: "success",
  },
  {
    time: "5:15 PM",
    title: "Wash dishes",
    owner: "Ben",
    tone: "info",
  },
  {
    time: "6:00 PM",
    title: "Soccer practice",
    owner: "Cam",
    tone: "warning",
  },
] as const;

const readinessItems = getBootstrapReadinessItems();

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
              Family Chore Hub
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
              Today&apos;s family plan, ready for fair chores and busy schedules.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Supabase Auth is ready for parent and caregiver accounts. Family
              data, assignments, and reviews arrive in later approved phases.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                href="/sign-up"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-sm">
            <Metric label="Kids" value="3" />
            <Metric label="Chores" value="2" />
            <Metric label="Alerts" value="1" />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section
            aria-labelledby="schedule-heading"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="schedule-heading"
                  className="text-xl font-semibold text-[var(--foreground)]"
                >
                  Schedule Glance
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  A static preview of the app surface this foundation supports.
                </p>
              </div>
              <StatusPill tone="info">Bootstrap preview</StatusPill>
            </div>

            <div className="mt-5 grid gap-3">
              {scheduleItems.map((item) => (
                <article
                  className="grid grid-cols-[76px_1fr] gap-3 rounded-lg border border-[var(--line)] p-3"
                  key={`${item.time}-${item.title}`}
                >
                  <time className="text-sm font-semibold text-[var(--muted)]">
                    {item.time}
                  </time>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {item.title}
                      </h3>
                      <StatusPill tone={item.tone}>{item.owner}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Later phases will replace this preview with family-owned
                      schedule and chore data.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside
            aria-labelledby="members-heading"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
          >
            <h2
              id="members-heading"
              className="text-xl font-semibold text-[var(--foreground)]"
            >
              Family Members
            </h2>
            <div className="mt-5 grid gap-3">
              {familyMembers.map((member) => (
                <article
                  className="flex items-center gap-3 rounded-lg border border-[var(--line)] p-3"
                  key={member.name}
                >
                  <div
                    aria-hidden="true"
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${member.color}`}
                  >
                    {member.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {member.name}, {member.age}
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                      {member.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section
          aria-labelledby="readiness-heading"
          className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
        >
          <h2
            id="readiness-heading"
            className="text-xl font-semibold text-[var(--foreground)]"
          >
            Foundation Readiness
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {readinessItems.map((item) => (
              <article
                className="rounded-lg border border-[var(--line)] p-3"
                key={item.label}
              >
                <StatusPill tone={item.tone}>{item.status}</StatusPill>
                <h3 className="mt-3 font-semibold text-[var(--foreground)]">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-16 rounded-md bg-slate-50 p-3 text-center">
      <div className="text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

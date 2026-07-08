import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    return (
      <section className="grid gap-5">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <StatusPill tone="warning">Setup needed</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
            Create your family workspace
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Your account is signed in. Add a family name and parent profile to
            start managing child profiles.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href="/family/setup"
          >
            Start family setup
          </Link>
        </div>
      </section>
    );
  }

  const activeChildren = context.members.filter(
    (member) =>
      member.role === "child" && member.lifecycleStatus === "active",
  );
  const childrenNeedingRest = activeChildren.filter((member) =>
    ["under_the_weather", "sick", "rest_day"].includes(
      member.currentStatus?.status ?? "normal",
    ),
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Protected</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          {context.family.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Parent-managed family profiles are connected to Supabase RLS. Chores,
          schedules, rewards, and reviews arrive in later approved phases.
        </p>
        <Link
          className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
          href="/settings/family"
        >
          Manage family
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Active kids" value={activeChildren.length} />
        <MetricCard label="Rest flags" value={childrenNeedingRest.length} />
        <MetricCard label="Family members" value={context.members.length} />
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Kids
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {activeChildren.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] md:col-span-3">
              Add child profiles from family settings.
            </p>
          ) : null}
          {activeChildren.map((member) => (
            <article
              className="rounded-md border border-[var(--line)] p-4"
              key={member.id}
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: member.color ?? "#047857" }}
                >
                  {member.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {member.displayName}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Age {member.ageYears ?? "unknown"} · ability{" "}
                    {member.abilityLevel}/5
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Status: {member.currentStatus?.status ?? "normal"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--accent-strong)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </article>
  );
}

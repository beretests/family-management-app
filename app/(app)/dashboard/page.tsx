import { StatusPill } from "@/components/ui/status-pill";

export const dynamic = "force-dynamic";

const nextSteps = [
  "Create the Supabase schema and RLS policies in Phase 3.",
  "Add parent-managed family and kid profiles in Phase 4.",
  "Replace this placeholder with real family dashboard data as features land.",
];

export default function DashboardPage() {
  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="success">Protected</StatusPill>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Parent Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          This route is protected by Supabase Auth. Family data, roles, RLS, and
          dashboard widgets are intentionally deferred to the next approved
          phases.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {nextSteps.map((step, index) => (
          <article
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
            key={step}
          >
            <p className="text-sm font-semibold text-[var(--accent-strong)]">
              Step {index + 1}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {step}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

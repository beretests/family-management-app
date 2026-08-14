import { InlineLoading } from "@/components/family/form-status";

export function LoadingPanel({
  label = "Loading",
  title = "Getting things ready",
}: {
  label?: string;
  title?: string;
}) {
  return (
    <section
      aria-busy="true"
      className="grid gap-5 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <div>
        <InlineLoading label={label} />
        <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
          {title}
        </h1>
      </div>
      <div className="grid gap-3" aria-hidden="true">
        <div className="h-4 w-2/3 rounded-full bg-[var(--line)]" />
        <div className="h-4 w-1/2 rounded-full bg-[var(--line)]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-md bg-[var(--accent-soft)]" />
          <div className="h-24 rounded-md bg-[var(--info-soft)]" />
          <div className="h-24 rounded-md bg-[var(--warning-soft)]" />
        </div>
      </div>
    </section>
  );
}

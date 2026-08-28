import Link from "next/link";
import { GroceryListManager } from "@/components/groceries/grocery-list-manager";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { getGroceryPageData } from "@/features/groceries/queries";

export const dynamic = "force-dynamic";

export default async function GroceriesPage() {
  const context = await getFamilyContext();

  if (!context.family || !context.currentMember) {
    return (
      <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <StatusPill tone="warning">Setup needed</StatusPill>
        <h1 className="mt-4 text-2xl font-extrabold">
          Create your family workspace
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Grocery lists are available after family setup.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-bold text-white"
          href="/family/setup"
        >
          Start family setup
        </Link>
      </section>
    );
  }

  const data = await getGroceryPageData(context.family.id);
  const remaining = data.items.filter((item) => !item.checked).length;

  return (
    <section className="grid gap-5">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
        <StatusPill tone="success">Shared family list</StatusPill>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Groceries</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Add groceries as they run low, check them off while shopping, and
          reuse saved items on the next list.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          <Metric label="Open lists" value={data.openList ? 1 : 0} />
          <Metric label="Still needed" value={remaining} />
          <Metric
            label="Saved items"
            value={data.catalog.filter((item) => item.active).length}
          />
        </div>
      </header>

      <GroceryListManager
        catalog={data.catalog}
        familyId={context.family.id}
        history={data.history}
        isParent={context.currentMember.role === "parent"}
        items={data.items}
        members={context.members}
        openList={data.openList}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-lg bg-[var(--accent-soft)] p-3 text-center">
      <p className="text-xl font-extrabold text-[var(--accent-strong)]">
        {value}
      </p>
      <p className="mt-1 break-words text-[0.65rem] font-bold uppercase tracking-wide text-[var(--muted)] sm:text-xs">
        {label}
      </p>
    </div>
  );
}

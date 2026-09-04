"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Archive,
  Check,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { DestructiveActionConfirmation } from "@/components/ui/destructive-action-confirmation";
import {
  addGroceryItem,
  createGroceryList,
  manageGroceryCatalogItem,
  manageGroceryList,
  removeGroceryItem,
  toggleGroceryItem,
  type GroceryActionState,
} from "@/features/groceries/actions";
import type {
  GroceryCatalogItem,
  GroceryList,
  GroceryListItem,
} from "@/features/groceries/types";
import type { FamilyMemberWithDetails } from "@/features/family/types";

const initialState: GroceryActionState = {};
const categories = [
  "Produce",
  "Dairy",
  "Meat",
  "Pantry",
  "Frozen",
  "Household",
  "Other",
] as const;
const units = ["", "each", "bag", "box", "bottle", "can", "kg", "g", "L", "mL"];

export function GroceryListManager({
  catalog,
  familyId,
  history,
  isParent,
  items,
  members,
  openList,
}: {
  catalog: GroceryCatalogItem[];
  familyId: string;
  history: GroceryList[];
  isParent: boolean;
  items: GroceryListItem[];
  members: FamilyMemberWithDetails[];
  openList: GroceryList | null;
}) {
  const activeCatalog = catalog.filter((item) => item.active);

  return (
    <div className="grid gap-5">
      {openList ? (
        <OpenGroceryList
          catalog={activeCatalog}
          familyId={familyId}
          isParent={isParent}
          items={items}
          list={openList}
          members={members}
        />
      ) : (
        <StartGroceryListForm catalog={activeCatalog} familyId={familyId} />
      )}

      {isParent && catalog.length > 0 ? (
        <SavedGroceryManager catalog={catalog} familyId={familyId} />
      ) : null}

      {history.length > 0 ? (
        <GroceryHistory
          familyId={familyId}
          history={history}
          isParent={isParent}
        />
      ) : null}
    </div>
  );
}

function StartGroceryListForm({
  catalog,
  familyId,
}: {
  catalog: GroceryCatalogItem[];
  familyId: string;
}) {
  const [state, formAction] = useActionState(createGroceryList, initialState);
  const [search, setSearch] = useState("");
  const visibleCatalog = filterCatalog(catalog, search);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <ShoppingBasket aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--foreground)]">
            Start a grocery list
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            There is no open list. Start one empty or prefill it from saved
            groceries.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-5 grid gap-4">
        <input name="familyId" type="hidden" value={familyId} />
        <ActionMessage error={state.error} success={state.success} />
        <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
          List name{" "}
          <span className="font-normal text-[var(--muted)]">(optional)</span>
          <input
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
            maxLength={120}
            name="name"
            placeholder="Groceries for this week"
          />
        </label>

        {catalog.length > 0 ? (
          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-[var(--foreground)]">
              Add saved groceries
            </legend>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Search saved items
              <input
                className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base text-[var(--foreground)]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Milk, apples, detergent..."
                type="search"
                value={search}
              />
            </label>
            <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-[var(--line)] p-2 sm:grid-cols-2">
              {visibleCatalog.map((item) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm hover:bg-[var(--accent-soft)]"
                  key={item.id}
                >
                  <input
                    className="size-5"
                    name="catalogItemIds"
                    type="checkbox"
                    value={item.id}
                  />
                  <span className="min-w-0">
                    <span className="block break-words font-semibold">
                      {item.name}
                    </span>
                    {item.category ? (
                      <span className="block text-xs text-[var(--muted)]">
                        {item.category}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
              {visibleCatalog.length === 0 ? (
                <p className="p-2 text-sm text-[var(--muted)]">
                  No saved items match.
                </p>
              ) : null}
            </div>
          </fieldset>
        ) : null}

        <div>
          <SubmitButton pendingLabel="Starting list...">
            Start list
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

function OpenGroceryList({
  catalog,
  familyId,
  isParent,
  items,
  list,
  members,
}: {
  catalog: GroceryCatalogItem[];
  familyId: string;
  isParent: boolean;
  items: GroceryListItem[];
  list: GroceryList;
  members: FamilyMemberWithDetails[];
}) {
  const remaining = items.filter((item) => !item.checked);
  const checked = items.filter((item) => item.checked);
  const progress =
    items.length === 0 ? 0 : Math.round((checked.length / items.length) * 100);

  return (
    <>
      <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-strong)]">
              Open household list
            </p>
            <h2 className="mt-1 break-words text-2xl font-extrabold text-[var(--foreground)]">
              {list.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {checked.length} of {items.length} checked · {progress}% complete
            </p>
          </div>
          {isParent ? (
            <ListLifecycleForm familyId={familyId} list={list} mode="open" />
          ) : null}
        </div>
        <div
          aria-label={`${progress}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <QuickAddItemForm familyId={familyId} groceryListId={list.id} />

      {catalog.length > 0 ? (
        <SavedGroceryPicker
          catalog={catalog}
          familyId={familyId}
          groceryListId={list.id}
          items={items}
        />
      ) : null}

      <section aria-labelledby="grocery-items-heading" className="grid gap-4">
        <div>
          <h2 className="text-xl font-extrabold" id="grocery-items-heading">
            Shopping items
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Everyone in the family can add, check, return, or remove items.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
            This list is empty. Add something that is running low.
          </p>
        ) : null}
        {remaining.length > 0 ? (
          <div className="grid gap-2">
            {remaining.map((item) => (
              <GroceryItemRow
                familyId={familyId}
                item={item}
                key={item.id}
                members={members}
              />
            ))}
          </div>
        ) : null}
        {checked.length > 0 ? (
          <details
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"
            open={remaining.length === 0}
          >
            <summary className="cursor-pointer text-sm font-bold">
              Checked items ({checked.length})
            </summary>
            <div className="mt-3 grid gap-2">
              {checked.map((item) => (
                <GroceryItemRow
                  familyId={familyId}
                  item={item}
                  key={item.id}
                  members={members}
                />
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </>
  );
}

function QuickAddItemForm({
  familyId,
  groceryListId,
}: {
  familyId: string;
  groceryListId: string;
}) {
  const [state, formAction] = useActionState(addGroceryItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.submissionId && state.success) {
      formRef.current?.reset();
    }
  }, [state.submissionId, state.success]);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-extrabold">Add something low</h2>
      <form action={formAction} className="mt-4 grid gap-3" ref={formRef}>
        <input name="familyId" type="hidden" value={familyId} />
        <input name="groceryListId" type="hidden" value={groceryListId} />
        <ActionMessage error={state.error} success={state.success} />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_100px_120px]">
          <label className="grid gap-1.5 text-sm font-semibold">
            Item
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
              maxLength={120}
              name="name"
              placeholder="Milk"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Quantity
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
              min="0.01"
              name="quantity"
              placeholder="1"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Unit
            <select
              className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
              name="unit"
            >
              {units.map((unit) => (
                <option key={unit || "none"} value={unit}>
                  {unit || "None"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            Category
            <select
              className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
              name="category"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Note{" "}
            <span className="font-normal text-[var(--muted)]">(optional)</span>
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
              maxLength={240}
              name="note"
              placeholder="Unsweetened, large size..."
            />
          </label>
        </div>
        <div>
          <SubmitButton pendingLabel="Adding item...">
            <Plus aria-hidden="true" className="size-4" /> Add item
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

function SavedGroceryPicker({
  catalog,
  familyId,
  groceryListId,
  items,
}: {
  catalog: GroceryCatalogItem[];
  familyId: string;
  groceryListId: string;
  items: GroceryListItem[];
}) {
  const [search, setSearch] = useState("");
  const existingCatalogIds = new Set(items.map((item) => item.catalogItemId));
  const visibleCatalog = filterCatalog(catalog, search);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-extrabold">Add from saved groceries</h2>
      <label className="mt-3 grid gap-1.5 text-sm font-semibold">
        Search saved items
        <input
          className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search the family catalog"
          type="search"
          value={search}
        />
      </label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCatalog.map((item) => (
          <CatalogAddForm
            disabled={existingCatalogIds.has(item.id)}
            familyId={familyId}
            groceryListId={groceryListId}
            item={item}
            key={item.id}
          />
        ))}
        {visibleCatalog.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No saved items match.</p>
        ) : null}
      </div>
    </section>
  );
}

function CatalogAddForm({
  disabled,
  familyId,
  groceryListId,
  item,
}: {
  disabled: boolean;
  familyId: string;
  groceryListId: string;
  item: GroceryCatalogItem;
}) {
  const [state, formAction] = useActionState(addGroceryItem, initialState);

  return (
    <form action={formAction} className="grid gap-1">
      <input name="catalogItemId" type="hidden" value={item.id} />
      <input name="familyId" type="hidden" value={familyId} />
      <input name="groceryListId" type="hidden" value={groceryListId} />
      <button
        className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-left text-sm font-semibold transition hover:border-[var(--accent)] disabled:cursor-default disabled:bg-slate-100 disabled:text-[var(--muted)]"
        disabled={disabled}
        type="submit"
      >
        <span className="min-w-0 break-words">{item.name}</span>
        <span className="shrink-0 text-xs">{disabled ? "Added" : "+ Add"}</span>
      </button>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function GroceryItemRow({
  familyId,
  item,
  members,
}: {
  familyId: string;
  item: GroceryListItem;
  members: FamilyMemberWithDetails[];
}) {
  const [toggleState, toggleAction] = useActionState(
    toggleGroceryItem,
    initialState,
  );
  const [removeState, removeAction] = useActionState(
    removeGroceryItem,
    initialState,
  );
  const addedBy = members.find(
    (member) => member.id === item.addedByMemberId,
  )?.displayName;
  const checkedBy = members.find(
    (member) => member.id === item.checkedByMemberId,
  )?.displayName;
  const quantity = formatQuantity(item.quantity, item.unit);

  return (
    <article
      className={`rounded-xl border border-[var(--line)] bg-white p-3 shadow-sm ${item.checked ? "opacity-75" : ""}`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3
            className={`break-words font-bold ${item.checked ? "line-through" : ""}`}
          >
            {item.name}
          </h3>
          <p className="mt-1 break-words text-xs text-[var(--muted)]">
            {[quantity, item.category, addedBy ? `Added by ${addedBy}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {item.note ? (
            <p className="mt-1 break-words text-sm text-[var(--muted)]">
              {item.note}
            </p>
          ) : null}
          {item.checked && checkedBy ? (
            <p className="mt-1 text-xs font-semibold text-[var(--accent-strong)]">
              Checked by {checkedBy}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <form action={toggleAction}>
            <ItemHiddenFields familyId={familyId} item={item} />
            <input
              name="checked"
              type="hidden"
              value={item.checked ? "false" : "true"}
            />
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-bold text-white sm:w-auto"
              type="submit"
            >
              {item.checked ? (
                <RotateCcw aria-hidden="true" className="size-4" />
              ) : (
                <Check aria-hidden="true" className="size-4" />
              )}
              {item.checked ? "Put back" : "Bought"}
            </button>
          </form>
          <form action={removeAction}>
            <ItemHiddenFields familyId={familyId} item={item} />
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--warning)] px-3 text-sm font-bold text-[var(--warning)] sm:w-auto"
              type="submit"
            >
              <Trash2 aria-hidden="true" className="size-4" /> Remove
            </button>
          </form>
        </div>
      </div>
      <ActionMessage
        error={toggleState.error ?? removeState.error}
        success={toggleState.success ?? removeState.success}
      />
    </article>
  );
}

function ItemHiddenFields({
  familyId,
  item,
}: {
  familyId: string;
  item: GroceryListItem;
}) {
  return (
    <>
      <input name="familyId" type="hidden" value={familyId} />
      <input name="groceryItemId" type="hidden" value={item.id} />
      <input name="groceryListId" type="hidden" value={item.groceryListId} />
    </>
  );
}

function ListLifecycleForm({
  familyId,
  list,
  mode,
}: {
  familyId: string;
  list: GroceryList;
  mode: "open" | "history";
}) {
  const [state, formAction] = useActionState(manageGroceryList, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="familyId" type="hidden" value={familyId} />
      <input name="groceryListId" type="hidden" value={list.id} />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {mode === "open" ? (
          <>
            <LifecycleButton intent="complete" label="Complete" />
            <LifecycleButton intent="archive" label="Archive" />
          </>
        ) : (
          <>
            <LifecycleButton intent="reopen" label="Reopen" />
            <DestructiveActionConfirmation
              cancelLabel="Keep list"
              confirmLabel="Delete permanently"
              description={`“${list.name}” and its items will be permanently deleted. This cannot be undone.`}
              pendingLabel="Deleting list..."
              submitName="intent"
              submitValue="delete"
              title="Permanently delete this list?"
              triggerLabel="Delete"
            />
          </>
        )}
      </div>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function LifecycleButton({
  intent,
  label,
}: {
  intent: "complete" | "archive" | "reopen";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      name="intent"
      type="submit"
      value={intent}
    >
      {intent === "archive" ? (
        <Archive aria-hidden="true" className="size-4" />
      ) : null}
      {intent === "reopen" ? (
        <RotateCcw aria-hidden="true" className="size-4" />
      ) : null}
      {intent === "complete" ? (
        <Check aria-hidden="true" className="size-4" />
      ) : null}
      {label}
    </button>
  );
}

function SavedGroceryManager({
  catalog,
  familyId,
}: {
  catalog: GroceryCatalogItem[];
  familyId: string;
}) {
  return (
    <details className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <summary className="cursor-pointer text-lg font-extrabold">
        Manage saved groceries ({catalog.length})
      </summary>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Hidden items stay on old lists and can be restored later.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((item) => (
          <CatalogLifecycleForm familyId={familyId} item={item} key={item.id} />
        ))}
      </div>
    </details>
  );
}

function CatalogLifecycleForm({
  familyId,
  item,
}: {
  familyId: string;
  item: GroceryCatalogItem;
}) {
  const [state, formAction] = useActionState(
    manageGroceryCatalogItem,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[var(--line)] bg-white p-3"
    >
      <input
        name="active"
        type="hidden"
        value={item.active ? "false" : "true"}
      />
      <input name="catalogItemId" type="hidden" value={item.id} />
      <input name="familyId" type="hidden" value={familyId} />
      <p className="break-words text-sm font-bold">{item.name}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {item.active ? "Available for new lists" : "Hidden from new lists"}
      </p>
      <button
        className="mt-3 min-h-10 rounded-md border border-[var(--line)] px-3 text-xs font-bold"
        type="submit"
      >
        {item.active ? "Hide saved item" : "Restore saved item"}
      </button>
      <ActionMessage error={state.error} success={state.success} />
    </form>
  );
}

function GroceryHistory({
  familyId,
  history,
  isParent,
}: {
  familyId: string;
  history: GroceryList[];
  isParent: boolean;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-xl font-extrabold">Recent lists</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Completed and archived lists are automatically deleted after 90 days.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {history.map((list) => (
          <article
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
            key={list.id}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-strong)]">
              {list.status}
            </p>
            <h3 className="mt-1 break-words font-extrabold">{list.name}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {list.checkedItemCount} of {list.itemCount} checked
            </p>
            {list.deleteAfter ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Scheduled for deletion {formatDate(list.deleteAfter)}
              </p>
            ) : null}
            {isParent ? (
              <div className="mt-3">
                <ListLifecycleForm
                  familyId={familyId}
                  list={list}
                  mode="history"
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function filterCatalog(catalog: GroceryCatalogItem[], search: string) {
  const normalized = search.trim().toLowerCase();

  if (!normalized) {
    return catalog;
  }

  return catalog.filter((item) =>
    `${item.name} ${item.category ?? ""}`.toLowerCase().includes(normalized),
  );
}

function formatQuantity(quantity: number | null, unit: string | null) {
  if (quantity === null) {
    return null;
  }

  return `${Number(quantity)}${unit ? ` ${unit}` : ""}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

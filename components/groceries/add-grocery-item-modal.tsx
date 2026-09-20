"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { Modal } from "@/components/ui/modal";
import {
  addGroceryItem,
  type GroceryActionState,
} from "@/features/groceries/actions";
import type {
  GroceryCatalogItem,
  GroceryList,
  GroceryListItem,
} from "@/features/groceries/types";

const categories = [
  "Produce",
  "Dairy",
  "Meat",
  "Pantry",
  "Frozen",
  "Household",
  "Other",
];
const units = ["", "each", "bag", "box", "bottle", "can", "kg", "g", "L", "mL"];

export function AddGroceryItemModal({
  catalog,
  items,
  list,
  onClose,
}: {
  catalog: GroceryCatalogItem[];
  items: GroceryListItem[];
  list: GroceryList;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    addGroceryItem,
    {} as GroceryActionState,
  );
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<GroceryCatalogItem | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const hintId = useId();
  const existingIds = new Set(items.map((item) => item.catalogItemId));
  const matches = catalog.filter(
    (item) =>
      item.active &&
      `${item.name} ${item.category ?? ""}`
        .toLowerCase()
        .includes(name.trim().toLowerCase()),
  );
  const available = matches.filter((item) => !existingIds.has(item.id));
  const activeItem = expanded
    ? available.find((item) => item.id === activeId)
    : undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (state.success) onClose();
  }, [state.submissionId, state.success, onClose]);

  function choose(item: GroceryCatalogItem) {
    setSelected(item);
    setName(item.name);
    setQuantity(
      item.defaultQuantity === null ? "" : String(item.defaultQuantity),
    );
    setUnit(item.defaultUnit ?? "");
    setCategory(item.category ?? "");
    setExpanded(false);
    setActiveId(null);
    inputRef.current?.focus();
  }

  return (
    <Modal
      closeLabel="Close add item"
      eyebrow={list.name}
      onClose={onClose}
      title="Add item"
    >
      <form action={formAction} className="grid gap-4">
        <input name="familyId" type="hidden" value={list.familyId} />
        <input name="groceryListId" type="hidden" value={list.id} />
        <input name="catalogItemId" type="hidden" value={selected?.id ?? ""} />
        <ActionMessage error={state.error} />
        <fieldset className="grid min-w-0 gap-4" disabled={pending}>
          <div
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setExpanded(false);
            }}
          >
            <label className="grid gap-1.5 text-sm font-semibold">
              Item
              <input
                aria-activedescendant={
                  activeItem ? `${listboxId}-${activeItem.id}` : undefined
                }
                aria-autocomplete="list"
                aria-controls={expanded ? listboxId : undefined}
                aria-describedby={hintId}
                aria-expanded={expanded}
                autoComplete="off"
                className="min-h-11 w-full rounded-md border border-[var(--line)] px-3 text-base"
                maxLength={120}
                name="name"
                onChange={(event) => {
                  setName(event.target.value);
                  if (selected) {
                    setQuantity("");
                    setUnit("");
                    setCategory("");
                  }
                  setSelected(null);
                  setExpanded(true);
                  setActiveId(null);
                }}
                onFocus={() => setExpanded(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && expanded) {
                    event.preventDefault();
                    event.stopPropagation();
                    setExpanded(false);
                  } else if (
                    event.key === "ArrowDown" ||
                    event.key === "ArrowUp"
                  ) {
                    event.preventDefault();
                    setExpanded(true);
                    const index = available.findIndex(
                      (item) => item.id === activeId,
                    );
                    const next =
                      event.key === "ArrowDown"
                        ? (index + 1) % available.length
                        : index <= 0
                          ? available.length - 1
                          : index - 1;
                    setActiveId(available[next]?.id ?? null);
                    requestAnimationFrame(() =>
                      document
                        .getElementById(`${listboxId}-${available[next]?.id}`)
                        ?.scrollIntoView({ block: "nearest" }),
                    );
                  } else if (event.key === "Enter" && activeItem) {
                    event.preventDefault();
                    choose(activeItem);
                  }
                }}
                placeholder="Search saved groceries or type a new item"
                ref={inputRef}
                required
                role="combobox"
                value={name}
              />
            </label>
            <p className="mt-1 text-xs text-[var(--muted)]" id={hintId}>
              Choose a saved grocery to fill in its details, or type something
              new.
            </p>
            {expanded ? (
              <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[var(--line)] bg-white shadow-lg">
                <ul aria-label="Saved groceries" id={listboxId} role="listbox">
                  {matches.map((item) => (
                    <li key={item.id} role="presentation">
                      <button
                        aria-disabled={existingIds.has(item.id)}
                        aria-selected={activeItem?.id === item.id}
                        className={`flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)] ${activeItem?.id === item.id ? "bg-[var(--accent-soft)]" : ""} ${existingIds.has(item.id) ? "text-[var(--muted)]" : ""}`}
                        id={`${listboxId}-${item.id}`}
                        onClick={() => {
                          if (!existingIds.has(item.id)) choose(item);
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                        role="option"
                        tabIndex={-1}
                        type="button"
                      >
                        <span className="min-w-0 break-words font-semibold">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-xs">
                          {existingIds.has(item.id)
                            ? "Already on list"
                            : item.category}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {matches.length === 0 ? (
                  <p className="p-3 text-sm text-[var(--muted)]">
                    No saved groceries match. Add it as a new item.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-sm font-semibold">
              Quantity
              <input
                className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3 text-base"
                min="0.01"
                max="999999.99"
                name="quantity"
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="1"
                step="0.01"
                type="number"
                value={quantity}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Unit
              <select
                className="min-h-11 min-w-0 rounded-md border border-[var(--line)] bg-white px-3 text-base"
                name="unit"
                onChange={(event) => setUnit(event.target.value)}
                value={unit}
              >
                {[...new Set([...units, unit])].map((value) => (
                  <option key={value} value={value}>
                    {value || "None"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-semibold">
            Category
            <select
              className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-base"
              name="category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">No category</option>
              {[...new Set([...categories, category])]
                .filter(Boolean)
                .map((value) => (
                  <option key={value}>{value}</option>
                ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Note (optional)
            <input
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base"
              maxLength={240}
              name="note"
              placeholder="Unsweetened, large size..."
            />
          </label>
          <div>
            <SubmitButton pendingLabel="Adding item...">
              <Plus aria-hidden="true" className="size-4" />
              Add item
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

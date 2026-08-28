export function normalizeGroceryItemName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function defaultGroceryListName(now = new Date()) {
  const label = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  return `Groceries · ${label}`;
}

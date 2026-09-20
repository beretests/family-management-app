import type { GroceryList, GroceryListItem } from "@/features/groceries/types";

function csvCell(value: string | number | null) {
  const text = String(value ?? "");
  // Keep user-entered names/notes as text when opened by a spreadsheet.
  const safe =
    /^\s*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function groceryListCsv(list: GroceryList, items: GroceryListItem[]) {
  const rows: Array<Array<string | number | null>> = [
    ["List", "Item", "Quantity", "Unit", "Category", "Note", "Bought"],
    ...items
      .filter(
        (item) =>
          item.groceryListId === list.id && item.familyId === list.familyId,
      )
      .map((item) => [
        list.name,
        item.name,
        item.quantity,
        item.unit,
        item.category,
        item.note,
        item.checked ? "Yes" : "No",
      ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function groceryListFilename(name: string) {
  const safeName = name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${safeName || "grocery-list"}.csv`;
}

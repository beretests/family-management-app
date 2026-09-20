import { describe, expect, it } from "vitest";
import {
  groceryListCsv,
  groceryListFilename,
} from "@/features/groceries/export";
import type { GroceryList, GroceryListItem } from "@/features/groceries/types";

const list = {
  id: "list-1",
  familyId: "family-1",
  name: "Weekly groceries",
} as GroceryList;
const item = {
  groceryListId: list.id,
  familyId: list.familyId,
  name: 'Milk, "oat"',
  quantity: 2,
  unit: "L",
  category: "Dairy",
  note: "First line\nSecond line",
  checked: true,
} as GroceryListItem;

describe("grocery CSV download", () => {
  it("exports only the selected family's list and escapes quotes, commas and line breaks", () => {
    const csv = groceryListCsv(list, [
      item,
      { ...item, groceryListId: "other", name: "Hidden" },
      { ...item, familyId: "outsider", name: "Secret" },
    ]);
    expect(csv).toContain(
      '"Milk, ""oat""","2","L","Dairy","First line\nSecond line","Yes"',
    );
    expect(csv).not.toContain("Hidden");
    expect(csv).not.toContain("Secret");
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it.each([
    "=SUM(1,2)",
    "+123",
    "-123",
    "@SUM(A1)",
    "  =1",
    "\tformula",
    "\rformula",
  ])("neutralizes spreadsheet formulas: %s", (name) => {
    expect(groceryListCsv(list, [{ ...item, name }])).toContain(`"'${name}"`);
  });

  it("keeps an empty list downloadable and gives filenames a safe fallback", () => {
    expect(groceryListCsv(list, [])).toBe(
      '\uFEFF"List","Item","Quantity","Unit","Category","Note","Bought"\r\n',
    );
    expect(groceryListFilename("../../Weekly / groceries")).toBe(
      "Weekly-groceries.csv",
    );
    expect(groceryListFilename("///")).toBe("grocery-list.csv");
  });
});

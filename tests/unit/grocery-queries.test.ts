import { beforeEach, describe, expect, it, vi } from "vitest";
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
import { getGroceryPageData } from "@/features/groceries/queries";

type Row = Record<string, unknown>;
const familyId = "family";
const lists: Row[] = [
  { id: "first", family_id: familyId, name: "Weekly", status: "open" },
  { id: "second", family_id: familyId, name: "Weekend", status: "open" },
  { id: "closed", family_id: familyId, name: "Last week", status: "completed" },
  { id: "secret", family_id: "outsider", name: "Private", status: "open" },
];
let itemRows: Row[];
let failPage: boolean;

beforeEach(() => {
  failPage = false;
  itemRows = [
    ...Array.from({ length: 1001 }, (_, i) => ({
      id: `item-${i}`,
      family_id: familyId,
      grocery_list_id: "first",
      name_snapshot: `Grocery ${i}`,
      checked: i === 0,
    })),
    {
      id: "weekend",
      family_id: familyId,
      grocery_list_id: "second",
      checked: false,
    },
    {
      id: "history",
      family_id: familyId,
      grocery_list_id: "closed",
      checked: true,
    },
    {
      id: "secret-item",
      family_id: "outsider",
      grocery_list_id: "secret",
      checked: false,
    },
  ];
  createClient.mockResolvedValue({
    from: (table: string) => {
      let rows =
        table === "grocery_lists"
          ? [...lists]
          : table === "grocery_list_items"
            ? [...itemRows]
            : [];
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          rows = rows.filter((row) => row[key] === value);
          return query;
        },
        neq: (key: string, value: unknown) => {
          rows = rows.filter((row) => row[key] !== value);
          return query;
        },
        in: (key: string, values: unknown[]) => {
          rows = rows.filter((row) => values.includes(row[key]));
          return query;
        },
        order: () => query,
        limit: (count: number) =>
          Promise.resolve({ data: rows.slice(0, count), error: null }),
        range: (from: number, to: number) =>
          Promise.resolve(
            failPage && table === "grocery_list_items" && from > 0
              ? { data: null, error: { message: "Read failed" } }
              : { data: rows.slice(from, to + 1), error: null },
          ),
      };
      return query;
    },
  });
});

describe("grocery page data", () => {
  it("loads all open lists and complete item data beyond a single API page", async () => {
    const data = await getGroceryPageData(familyId);
    expect(data.openLists.map((list) => list.id)).toEqual(["first", "second"]);
    expect(data.openLists[0]).toMatchObject({
      itemCount: 1001,
      checkedItemCount: 1,
    });
    expect(data.openLists[1]).toMatchObject({
      itemCount: 1,
      checkedItemCount: 0,
    });
    expect(data.history[0]).toMatchObject({
      id: "closed",
      itemCount: 1,
      checkedItemCount: 1,
    });
    expect(data.items).toHaveLength(1003);
    expect(data.items.some((item) => item.id === "secret-item")).toBe(false);
  });

  it("fails instead of offering incomplete downloads when a later page errors", async () => {
    failPage = true;
    await expect(getGroceryPageData(familyId)).rejects.toThrow("Read failed");
  });
});

import { describe, expect, it } from "vitest";
import {
  addGroceryItemSchema,
  createGroceryListSchema,
  groceryListLifecycleSchema,
} from "@/features/groceries/schemas";
import {
  defaultGroceryListName,
  normalizeGroceryItemName,
} from "@/features/groceries/names";

const familyId = "24444444-4444-4444-8444-444444444444";
const listId = "24888888-8888-4888-8888-888888888888";

describe("grocery schemas", () => {
  it("normalizes catalog names for family-level deduplication", () => {
    expect(normalizeGroceryItemName("  Green   APPLES ")).toBe("green apples");
  });

  it("creates a stable default list name", () => {
    expect(defaultGroceryListName(new Date("2026-08-28T12:00:00Z"))).toBe(
      "Groceries · Aug 28, 2026",
    );
  });

  it("accepts an empty list with deduplicated saved catalog choices", () => {
    const result = createGroceryListSchema.parse({
      catalogItemIds: [listId, listId],
      familyId,
      name: "",
    });

    expect(result.catalogItemIds).toEqual([listId]);
    expect(result.name).toBeUndefined();
  });

  it("requires a typed or saved item and validates positive quantity", () => {
    expect(
      addGroceryItemSchema.safeParse({
        familyId,
        groceryListId: listId,
        name: "",
        quantity: "",
      }).success,
    ).toBe(false);
    expect(
      addGroceryItemSchema.safeParse({
        familyId,
        groceryListId: listId,
        name: "Milk",
        quantity: "-1",
      }).success,
    ).toBe(false);
    expect(
      addGroceryItemSchema.safeParse({
        familyId,
        groceryListId: listId,
        name: "Milk",
        quantity: "2",
      }).success,
    ).toBe(true);
  });

  it("limits whole-list actions to known lifecycle intents", () => {
    expect(
      groceryListLifecycleSchema.safeParse({
        familyId,
        groceryListId: listId,
        intent: "archive",
      }).success,
    ).toBe(true);
    expect(
      groceryListLifecycleSchema.safeParse({
        familyId,
        groceryListId: listId,
        intent: "erase-everything",
      }).success,
    ).toBe(false);
  });
});

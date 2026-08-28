import { z } from "zod";

const optionalText = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) => value || undefined);

const optionalQuantity = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z
    .number()
    .positive("Quantity must be greater than zero.")
    .max(999999.99, "Use a smaller quantity.")
    .optional(),
);

export const createGroceryListSchema = z.object({
  catalogItemIds: z
    .array(z.string().uuid("Choose valid saved items."))
    .default([])
    .transform((values) => [...new Set(values)]),
  familyId: z.string().uuid("Missing family."),
  name: optionalText(120, "Use 120 characters or fewer."),
});

export const addGroceryItemSchema = z
  .object({
    catalogItemId: z.string().uuid("Choose a valid saved item.").optional(),
    category: optionalText(60, "Use 60 characters or fewer."),
    familyId: z.string().uuid("Missing family."),
    groceryListId: z.string().uuid("Missing grocery list."),
    name: optionalText(120, "Use 120 characters or fewer."),
    note: optionalText(240, "Use 240 characters or fewer."),
    quantity: optionalQuantity,
    unit: optionalText(30, "Use 30 characters or fewer."),
  })
  .refine((value) => Boolean(value.catalogItemId || value.name), {
    message: "Enter an item or choose a saved item.",
    path: ["name"],
  });

export const groceryItemMutationSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  groceryItemId: z.string().uuid("Missing grocery item."),
  groceryListId: z.string().uuid("Missing grocery list."),
});

export const toggleGroceryItemSchema = groceryItemMutationSchema.extend({
  checked: z.boolean(),
});

export const groceryListLifecycleSchema = z.object({
  familyId: z.string().uuid("Missing family."),
  groceryListId: z.string().uuid("Missing grocery list."),
  intent: z.enum(["complete", "archive", "reopen", "delete"]),
});

export const groceryCatalogLifecycleSchema = z.object({
  active: z.boolean(),
  catalogItemId: z.string().uuid("Missing saved item."),
  familyId: z.string().uuid("Missing family."),
});

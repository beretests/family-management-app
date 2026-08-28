"use server";

import { refresh, revalidatePath } from "next/cache";
import {
  addGroceryItemSchema,
  createGroceryListSchema,
  groceryCatalogLifecycleSchema,
  groceryItemMutationSchema,
  groceryListLifecycleSchema,
  toggleGroceryItemSchema,
} from "@/features/groceries/schemas";
import {
  defaultGroceryListName,
  normalizeGroceryItemName,
} from "@/features/groceries/names";
import {
  requireGroceryActor,
  type GroceryActor,
  type GrocerySupabaseClient,
} from "@/features/groceries/permissions";
import { requireParentContext } from "@/lib/permissions/family";
import { createClient } from "@/lib/supabase/server";
import { GROCERY_LIST_RETENTION_DAYS } from "@/lib/groceries/cleanup";

export type GroceryActionState = {
  error?: string;
  success?: string;
  submissionId?: string;
};

type CatalogSource = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
  default_quantity: number | null;
  default_unit: string | null;
  active: boolean;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function success(message: string): GroceryActionState {
  return { success: message, submissionId: crypto.randomUUID() };
}

function finishGroceryMutation() {
  revalidatePath("/groceries");
  refresh();
}

async function insertAuditEvent({
  actorMemberId,
  eventType,
  familyId,
  metadata,
  supabase,
  targetId,
  targetTable,
}: {
  actorMemberId: string;
  eventType: string;
  familyId: string;
  metadata?: Record<string, unknown>;
  supabase: GrocerySupabaseClient;
  targetId?: string;
  targetTable?: string;
}) {
  const { error } = await supabase.from("audit_events").insert({
    actor_member_id: actorMemberId,
    event_type: eventType,
    family_id: familyId,
    metadata: metadata ?? {},
    target_id: targetId ?? null,
    target_table: targetTable ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function requireOpenList({
  actor,
  groceryListId,
}: {
  actor: GroceryActor;
  groceryListId: string;
}) {
  const { data, error } = await actor.writeClient
    .from("grocery_lists")
    .select("id,family_id,status")
    .eq("id", groceryListId)
    .eq("family_id", actor.familyId)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("This grocery list is no longer open.");
  }
}

async function getCatalogItem({
  actor,
  catalogItemId,
}: {
  actor: GroceryActor;
  catalogItemId: string;
}) {
  const { data, error } = await actor.writeClient
    .from("grocery_catalog_items")
    .select("id,family_id,name,category,default_quantity,default_unit,active")
    .eq("family_id", actor.familyId)
    .eq("id", catalogItemId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("That saved grocery item is not available.");
  }

  return data as CatalogSource;
}

async function findOrCreateCatalogItem({
  actor,
  category,
  name,
  quantity,
  unit,
}: {
  actor: GroceryActor;
  category?: string;
  name: string;
  quantity?: number;
  unit?: string;
}): Promise<CatalogSource> {
  const normalizedName = normalizeGroceryItemName(name);
  const select =
    "id,family_id,name,category,default_quantity,default_unit,active";
  const existing = await actor.writeClient
    .from("grocery_catalog_items")
    .select(select)
    .eq("family_id", actor.familyId)
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data?.id) {
    return existing.data as CatalogSource;
  }

  const inserted = await actor.writeClient
    .from("grocery_catalog_items")
    .insert({
      category: category ?? null,
      created_by_member_id: actor.memberId,
      default_quantity: quantity ?? null,
      default_unit: unit ?? null,
      family_id: actor.familyId,
      name,
    })
    .select(select)
    .single();

  if (!inserted.error && inserted.data) {
    return inserted.data as CatalogSource;
  }

  if (inserted.error?.code !== "23505") {
    throw new Error(inserted.error?.message ?? "Could not save grocery item.");
  }

  const raced = await actor.writeClient
    .from("grocery_catalog_items")
    .select(select)
    .eq("family_id", actor.familyId)
    .eq("normalized_name", normalizedName)
    .single();

  if (raced.error || !raced.data) {
    throw new Error(raced.error?.message ?? "Could not save grocery item.");
  }

  return raced.data as CatalogSource;
}

export async function createGroceryList(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const parsed = createGroceryListSchema.safeParse({
    catalogItemIds: getStrings(formData, "catalogItemIds"),
    familyId: getString(formData, "familyId"),
    name: getString(formData, "name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireGroceryActor(supabase, parsed.data.familyId);
    let selectedCatalog: CatalogSource[] = [];

    if (parsed.data.catalogItemIds.length > 0) {
      const { data, error } = await actor.writeClient
        .from("grocery_catalog_items")
        .select(
          "id,family_id,name,category,default_quantity,default_unit,active",
        )
        .eq("family_id", actor.familyId)
        .eq("active", true)
        .in("id", parsed.data.catalogItemIds);

      if (error) {
        throw new Error(error.message);
      }

      selectedCatalog = (data ?? []) as CatalogSource[];

      if (selectedCatalog.length !== parsed.data.catalogItemIds.length) {
        throw new Error("Choose active saved grocery items.");
      }
    }

    const groceryListId = crypto.randomUUID();
    const { error: listError } = await actor.writeClient
      .from("grocery_lists")
      .insert({
        created_by_member_id: actor.memberId,
        family_id: actor.familyId,
        id: groceryListId,
        name: parsed.data.name ?? defaultGroceryListName(),
      });

    if (listError?.code === "23505") {
      return {
        error: "Finish or archive the current list before starting another.",
      };
    }

    if (listError) {
      throw new Error(listError.message);
    }

    if (selectedCatalog.length > 0) {
      const { error: itemsError } = await actor.writeClient
        .from("grocery_list_items")
        .insert(
          selectedCatalog.map((item) => ({
            added_by_member_id: actor.memberId,
            catalog_item_id: item.id,
            category_snapshot: item.category,
            family_id: actor.familyId,
            grocery_list_id: groceryListId,
            name_snapshot: item.name,
            quantity: item.default_quantity,
            unit: item.default_unit,
          })),
        );

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    if (actor.role === "parent") {
      await insertAuditEvent({
        actorMemberId: actor.memberId,
        eventType: "grocery_list.created",
        familyId: actor.familyId,
        metadata: { initial_item_count: selectedCatalog.length },
        supabase: actor.writeClient,
        targetId: groceryListId,
        targetTable: "grocery_lists",
      });
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  return success("Grocery list started.");
}

export async function addGroceryItem(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const catalogItemId = getString(formData, "catalogItemId") || undefined;
  const parsed = addGroceryItemSchema.safeParse({
    catalogItemId,
    category: getString(formData, "category"),
    familyId: getString(formData, "familyId"),
    groceryListId: getString(formData, "groceryListId"),
    name: getString(formData, "name"),
    note: getString(formData, "note"),
    quantity: getString(formData, "quantity"),
    unit: getString(formData, "unit"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the item." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireGroceryActor(supabase, parsed.data.familyId);
    await requireOpenList({ actor, groceryListId: parsed.data.groceryListId });
    const catalogItem = parsed.data.catalogItemId
      ? await getCatalogItem({
          actor,
          catalogItemId: parsed.data.catalogItemId,
        })
      : await findOrCreateCatalogItem({
          actor,
          category: parsed.data.category,
          name: parsed.data.name as string,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
        });
    const { error } = await actor.writeClient
      .from("grocery_list_items")
      .insert({
        added_by_member_id: actor.memberId,
        catalog_item_id: catalogItem.id,
        category_snapshot: parsed.data.category ?? catalogItem.category,
        family_id: actor.familyId,
        grocery_list_id: parsed.data.groceryListId,
        name_snapshot: catalogItem.name,
        note: parsed.data.note ?? null,
        quantity: parsed.data.quantity ?? catalogItem.default_quantity,
        unit: parsed.data.unit ?? catalogItem.default_unit,
      });

    if (error?.code === "23505") {
      return { error: `${catalogItem.name} is already on this list.` };
    }

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  return success("Item added.");
}

export async function toggleGroceryItem(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const parsed = toggleGroceryItemSchema.safeParse({
    checked: getString(formData, "checked") === "true",
    familyId: getString(formData, "familyId"),
    groceryItemId: getString(formData, "groceryItemId"),
    groceryListId: getString(formData, "groceryListId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the item." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireGroceryActor(supabase, parsed.data.familyId);
    await requireOpenList({ actor, groceryListId: parsed.data.groceryListId });
    const { data, error } = await actor.writeClient
      .from("grocery_list_items")
      .update({
        checked: parsed.data.checked,
        checked_at: parsed.data.checked ? new Date().toISOString() : null,
        checked_by_member_id: parsed.data.checked ? actor.memberId : null,
      })
      .eq("family_id", actor.familyId)
      .eq("grocery_list_id", parsed.data.groceryListId)
      .eq("id", parsed.data.groceryItemId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.id) {
      throw new Error("That grocery item is no longer available.");
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  return success(
    parsed.data.checked ? "Item checked off." : "Item returned to list.",
  );
}

export async function removeGroceryItem(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const parsed = groceryItemMutationSchema.safeParse({
    familyId: getString(formData, "familyId"),
    groceryItemId: getString(formData, "groceryItemId"),
    groceryListId: getString(formData, "groceryListId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the item." };
  }

  const supabase = await createClient();

  try {
    const actor = await requireGroceryActor(supabase, parsed.data.familyId);
    await requireOpenList({ actor, groceryListId: parsed.data.groceryListId });
    const { data, error } = await actor.writeClient
      .from("grocery_list_items")
      .delete()
      .eq("family_id", actor.familyId)
      .eq("grocery_list_id", parsed.data.groceryListId)
      .eq("id", parsed.data.groceryItemId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.id) {
      throw new Error("That grocery item is no longer available.");
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  return success("Item removed. It remains in saved groceries.");
}

export async function manageGroceryList(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const parsed = groceryListLifecycleSchema.safeParse({
    familyId: getString(formData, "familyId"),
    groceryListId: getString(formData, "groceryListId"),
    intent: getString(formData, "intent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the list." };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);

    if (parsed.data.intent === "delete") {
      const { data, error } = await supabase
        .from("grocery_lists")
        .delete()
        .eq("family_id", parent.familyId)
        .eq("id", parsed.data.groceryListId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error("That grocery list is no longer available.");
      }

      await insertAuditEvent({
        actorMemberId: parent.memberId,
        eventType: "grocery_list.deleted",
        familyId: parent.familyId,
        supabase,
        targetId: parsed.data.groceryListId,
        targetTable: "grocery_lists",
      });
    } else if (parsed.data.intent === "reopen") {
      const { data, error } = await supabase
        .from("grocery_lists")
        .update({
          closed_at: null,
          closed_by_member_id: null,
          delete_after: null,
          status: "open",
        })
        .eq("family_id", parent.familyId)
        .eq("id", parsed.data.groceryListId)
        .neq("status", "open")
        .select("id")
        .maybeSingle();

      if (error?.code === "23505") {
        return {
          error: "Finish or archive the current list before reopening another.",
        };
      }

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error("That grocery list cannot be reopened.");
      }

      await insertAuditEvent({
        actorMemberId: parent.memberId,
        eventType: "grocery_list.reopened",
        familyId: parent.familyId,
        supabase,
        targetId: parsed.data.groceryListId,
        targetTable: "grocery_lists",
      });
    } else {
      const closedAt = new Date();
      const deleteAfter = new Date(closedAt);
      deleteAfter.setUTCDate(
        deleteAfter.getUTCDate() + GROCERY_LIST_RETENTION_DAYS,
      );
      const status =
        parsed.data.intent === "complete" ? "completed" : "archived";
      const { data, error } = await supabase
        .from("grocery_lists")
        .update({
          closed_at: closedAt.toISOString(),
          closed_by_member_id: parent.memberId,
          delete_after: deleteAfter.toISOString(),
          status,
        })
        .eq("family_id", parent.familyId)
        .eq("id", parsed.data.groceryListId)
        .eq("status", "open")
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error("That grocery list is no longer open.");
      }

      await insertAuditEvent({
        actorMemberId: parent.memberId,
        eventType: `grocery_list.${status}`,
        familyId: parent.familyId,
        metadata: { delete_after: deleteAfter.toISOString() },
        supabase,
        targetId: parsed.data.groceryListId,
        targetTable: "grocery_lists",
      });
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  const messages = {
    archive: "List archived for 90 days.",
    complete: "List completed and kept for 90 days.",
    delete: "List permanently deleted.",
    reopen: "List reopened.",
  } as const;
  return success(messages[parsed.data.intent]);
}

export async function manageGroceryCatalogItem(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const parsed = groceryCatalogLifecycleSchema.safeParse({
    active: getString(formData, "active") === "true",
    catalogItemId: getString(formData, "catalogItemId"),
    familyId: getString(formData, "familyId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the saved item.",
    };
  }

  const supabase = await createClient();

  try {
    const parent = await requireParentContext(supabase, parsed.data.familyId);
    const { data, error } = await supabase
      .from("grocery_catalog_items")
      .update({ active: parsed.data.active })
      .eq("family_id", parent.familyId)
      .eq("id", parsed.data.catalogItemId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.id) {
      throw new Error("That saved grocery item is no longer available.");
    }

    await insertAuditEvent({
      actorMemberId: parent.memberId,
      eventType: parsed.data.active
        ? "grocery_catalog.reactivated"
        : "grocery_catalog.deactivated",
      familyId: parent.familyId,
      supabase,
      targetId: parsed.data.catalogItemId,
      targetTable: "grocery_catalog_items",
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  finishGroceryMutation();
  return success(
    parsed.data.active
      ? "Saved item restored."
      : "Item removed from saved groceries.",
  );
}

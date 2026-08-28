import { createClient } from "@/lib/supabase/server";
import type {
  GroceryCatalogItem,
  GroceryList,
  GroceryListItem,
  GroceryListStatus,
  GroceryPageData,
} from "@/features/groceries/types";

type CatalogRow = {
  id: string;
  family_id: string;
  name: string;
  normalized_name: string;
  category: string | null;
  default_quantity: number | null;
  default_unit: string | null;
  active: boolean;
  created_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

type ListRow = {
  id: string;
  family_id: string;
  name: string;
  status: GroceryListStatus;
  created_by_member_id: string | null;
  closed_by_member_id: string | null;
  closed_at: string | null;
  delete_after: string | null;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  family_id: string;
  grocery_list_id: string;
  catalog_item_id: string | null;
  name_snapshot: string;
  category_snapshot: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  checked: boolean;
  checked_by_member_id: string | null;
  checked_at: string | null;
  added_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

const catalogSelect =
  "id,family_id,name,normalized_name,category,default_quantity,default_unit,active,created_by_member_id,created_at,updated_at";
const listSelect =
  "id,family_id,name,status,created_by_member_id,closed_by_member_id,closed_at,delete_after,created_at,updated_at";
const itemSelect =
  "id,family_id,grocery_list_id,catalog_item_id,name_snapshot,category_snapshot,quantity,unit,note,checked,checked_by_member_id,checked_at,added_by_member_id,created_at,updated_at";

function mapCatalog(row: CatalogRow): GroceryCatalogItem {
  return {
    active: row.active,
    category: row.category,
    createdAt: row.created_at,
    createdByMemberId: row.created_by_member_id,
    defaultQuantity: row.default_quantity,
    defaultUnit: row.default_unit,
    familyId: row.family_id,
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: ItemRow): GroceryListItem {
  return {
    addedByMemberId: row.added_by_member_id,
    catalogItemId: row.catalog_item_id,
    category: row.category_snapshot,
    checked: row.checked,
    checkedAt: row.checked_at,
    checkedByMemberId: row.checked_by_member_id,
    createdAt: row.created_at,
    familyId: row.family_id,
    groceryListId: row.grocery_list_id,
    id: row.id,
    name: row.name_snapshot,
    note: row.note,
    quantity: row.quantity,
    unit: row.unit,
    updatedAt: row.updated_at,
  };
}

function mapList(
  row: ListRow,
  items: Pick<GroceryListItem, "groceryListId" | "checked">[],
): GroceryList {
  const listItems = items.filter((item) => item.groceryListId === row.id);

  return {
    checkedItemCount: listItems.filter((item) => item.checked).length,
    closedAt: row.closed_at,
    closedByMemberId: row.closed_by_member_id,
    createdAt: row.created_at,
    createdByMemberId: row.created_by_member_id,
    deleteAfter: row.delete_after,
    familyId: row.family_id,
    id: row.id,
    itemCount: listItems.length,
    name: row.name,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function getGroceryPageData(
  familyId: string,
): Promise<GroceryPageData> {
  const supabase = await createClient();
  const [
    { data: catalogRows, error: catalogError },
    { data: openListRow, error: openListError },
    { data: historyRows, error: historyError },
  ] = await Promise.all([
    supabase
      .from("grocery_catalog_items")
      .select(catalogSelect)
      .eq("family_id", familyId)
      .order("active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("grocery_lists")
      .select(listSelect)
      .eq("family_id", familyId)
      .eq("status", "open")
      .maybeSingle(),
    supabase
      .from("grocery_lists")
      .select(listSelect)
      .eq("family_id", familyId)
      .neq("status", "open")
      .order("closed_at", { ascending: false })
      .limit(10),
  ]);

  if (catalogError) {
    throw new Error(catalogError.message);
  }

  if (openListError) {
    throw new Error(openListError.message);
  }

  if (historyError) {
    throw new Error(historyError.message);
  }

  const lists = [
    ...(openListRow ? [openListRow as ListRow] : []),
    ...((historyRows ?? []) as ListRow[]),
  ];
  const listIds = lists.map((list) => list.id);
  let items: GroceryListItem[] = [];

  if (listIds.length > 0) {
    const { data: itemRows, error: itemError } = await supabase
      .from("grocery_list_items")
      .select(itemSelect)
      .eq("family_id", familyId)
      .in("grocery_list_id", listIds)
      .order("checked", { ascending: true })
      .order("created_at", { ascending: true });

    if (itemError) {
      throw new Error(itemError.message);
    }

    items = ((itemRows ?? []) as ItemRow[]).map(mapItem);
  }

  const mappedLists = lists.map((list) => mapList(list, items));
  const openList = mappedLists.find((list) => list.status === "open") ?? null;

  return {
    catalog: ((catalogRows ?? []) as CatalogRow[]).map(mapCatalog),
    history: mappedLists.filter((list) => list.status !== "open").slice(0, 10),
    items: openList
      ? items.filter((item) => item.groceryListId === openList.id)
      : [],
    openList,
  };
}

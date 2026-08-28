export type GroceryListStatus = "open" | "completed" | "archived";

export type GroceryCatalogItem = {
  id: string;
  familyId: string;
  name: string;
  normalizedName: string;
  category: string | null;
  defaultQuantity: number | null;
  defaultUnit: string | null;
  active: boolean;
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroceryList = {
  id: string;
  familyId: string;
  name: string;
  status: GroceryListStatus;
  createdByMemberId: string | null;
  closedByMemberId: string | null;
  closedAt: string | null;
  deleteAfter: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  checkedItemCount: number;
};

export type GroceryListItem = {
  id: string;
  familyId: string;
  groceryListId: string;
  catalogItemId: string | null;
  name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  checked: boolean;
  checkedByMemberId: string | null;
  checkedAt: string | null;
  addedByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroceryPageData = {
  catalog: GroceryCatalogItem[];
  history: GroceryList[];
  items: GroceryListItem[];
  openList: GroceryList | null;
};

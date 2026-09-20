"use client";

import { Download } from "lucide-react";
import {
  groceryListCsv,
  groceryListFilename,
} from "@/features/groceries/export";
import type { GroceryList, GroceryListItem } from "@/features/groceries/types";

export function DownloadGroceryList({
  list,
  items,
}: {
  list: GroceryList;
  items: GroceryListItem[];
}) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([groceryListCsv(list, items)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = groceryListFilename(list.name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-bold"
      onClick={download}
      type="button"
    >
      <Download aria-hidden="true" className="size-4" />
      Download CSV
    </button>
  );
}

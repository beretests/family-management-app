import type { SupabaseClient } from "@supabase/supabase-js";

export const GROCERY_LIST_RETENTION_DAYS = 90;

export type GroceryCleanupCandidate = {
  familyId: string;
  id: string;
  status: string;
  deleteAfter: string | null;
};

export type GroceryCleanupResult = {
  deletedItems: number;
  deletedLists: number;
  scannedLists: number;
};

export function selectExpiredGroceryLists({
  candidates,
  now,
}: {
  candidates: GroceryCleanupCandidate[];
  now: Date;
}) {
  return candidates.filter(
    (candidate) =>
      (candidate.status === "completed" || candidate.status === "archived") &&
      Boolean(candidate.deleteAfter) &&
      new Date(candidate.deleteAfter as string).getTime() <= now.getTime(),
  );
}

export async function cleanupExpiredGroceryLists({
  batchSize = 100,
  now = new Date(),
  supabase,
}: {
  batchSize?: number;
  now?: Date;
  supabase: SupabaseClient;
}): Promise<GroceryCleanupResult> {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("id,family_id,status,delete_after")
    .in("status", ["completed", "archived"])
    .lte("delete_after", now.toISOString())
    .order("delete_after", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message);
  }

  const candidates = (data ?? []).map((row) => ({
    deleteAfter: row.delete_after as string | null,
    familyId: row.family_id as string,
    id: row.id as string,
    status: row.status as string,
  }));
  const expired = selectExpiredGroceryLists({ candidates, now });
  const expiredIds = expired.map((candidate) => candidate.id);
  let deletedLists = 0;
  let deletedItems = 0;

  if (expiredIds.length > 0) {
    const { count, error: itemCountError } = await supabase
      .from("grocery_list_items")
      .select("id", { count: "exact", head: true })
      .in("grocery_list_id", expiredIds);

    if (itemCountError) {
      throw new Error(itemCountError.message);
    }

    deletedItems = count ?? 0;
    const { data: deletedRows, error: deleteError } = await supabase
      .from("grocery_lists")
      .delete()
      .in("id", expiredIds)
      .in("status", ["completed", "archived"])
      .lte("delete_after", now.toISOString())
      .select("id,family_id");

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    deletedLists = deletedRows?.length ?? 0;

    if (deletedLists > 0) {
      const { error: auditError } = await supabase.from("audit_events").insert(
        deletedRows!.map((row) => ({
          actor_member_id: null,
          event_type: "grocery_list.retention_deleted",
          family_id: row.family_id,
          metadata: { retention_days: GROCERY_LIST_RETENTION_DAYS },
          target_id: row.id,
          target_table: "grocery_lists",
        })),
      );

      if (auditError) {
        throw new Error(auditError.message);
      }
    }
  }

  return {
    deletedItems,
    deletedLists,
    scannedLists: candidates.length,
  };
}

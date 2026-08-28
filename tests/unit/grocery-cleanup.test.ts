import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cleanupExpiredGroceryLists,
  GROCERY_LIST_RETENTION_DAYS,
  selectExpiredGroceryLists,
} from "@/lib/groceries/cleanup";

describe("grocery list cleanup", () => {
  it("uses the approved 90-day retention window", () => {
    expect(GROCERY_LIST_RETENTION_DAYS).toBe(90);
  });

  it("selects only completed or archived lists whose deletion date has passed", () => {
    const expired = selectExpiredGroceryLists({
      candidates: [
        {
          deleteAfter: "2026-08-28T11:59:59.000Z",
          familyId: "family",
          id: "completed",
          status: "completed",
        },
        {
          deleteAfter: "2026-08-28T12:00:00.000Z",
          familyId: "family",
          id: "archived",
          status: "archived",
        },
        {
          deleteAfter: "2026-08-29T12:00:00.000Z",
          familyId: "family",
          id: "future",
          status: "completed",
        },
        {
          deleteAfter: "2026-08-01T12:00:00.000Z",
          familyId: "family",
          id: "open",
          status: "open",
        },
        {
          deleteAfter: null,
          familyId: "family",
          id: "missing-date",
          status: "archived",
        },
      ],
      now: new Date("2026-08-28T12:00:00.000Z"),
    });

    expect(expired.map((candidate) => candidate.id)).toEqual([
      "completed",
      "archived",
    ]);
  });

  it("rechecks retention eligibility at deletion and audits rows actually deleted", async () => {
    const calls: Array<{ args: unknown[]; method: string; table: string }> = [];
    const auditRows: Array<Record<string, unknown>> = [];
    let groceryListCall = 0;

    function builder(
      table: string,
      result: { count?: number; data: unknown; error: null },
    ) {
      const query = {
        delete: (...args: unknown[]) => {
          calls.push({ args, method: "delete", table });
          return query;
        },
        in: (...args: unknown[]) => {
          calls.push({ args, method: "in", table });
          return query;
        },
        insert: (rows: Array<Record<string, unknown>>) => {
          auditRows.push(...rows);
          return query;
        },
        limit: (...args: unknown[]) => {
          calls.push({ args, method: "limit", table });
          return query;
        },
        lte: (...args: unknown[]) => {
          calls.push({ args, method: "lte", table });
          return query;
        },
        order: (...args: unknown[]) => {
          calls.push({ args, method: "order", table });
          return query;
        },
        select: (...args: unknown[]) => {
          calls.push({ args, method: "select", table });
          return query;
        },
        then: (
          resolve: (value: typeof result) => unknown,
          reject: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      };

      return query;
    }

    const supabase = {
      from(table: string) {
        if (table === "grocery_lists") {
          groceryListCall += 1;
          return groceryListCall === 1
            ? builder(table, {
                data: [
                  {
                    delete_after: "2026-08-28T11:59:59.000Z",
                    family_id: "family-1",
                    id: "list-1",
                    status: "completed",
                  },
                ],
                error: null,
              })
            : builder(table, {
                data: [{ family_id: "family-1", id: "list-1" }],
                error: null,
              });
        }

        if (table === "grocery_list_items") {
          return builder(table, { count: 3, data: null, error: null });
        }

        return builder(table, { data: null, error: null });
      },
    } as unknown as SupabaseClient;

    const result = await cleanupExpiredGroceryLists({
      now: new Date("2026-08-28T12:00:00.000Z"),
      supabase,
    });

    expect(result).toEqual({
      deletedItems: 3,
      deletedLists: 1,
      scannedLists: 1,
    });
    expect(calls).toContainEqual({
      args: ["status", ["completed", "archived"]],
      method: "in",
      table: "grocery_lists",
    });
    expect(calls).toContainEqual({
      args: ["delete_after", "2026-08-28T12:00:00.000Z"],
      method: "lte",
      table: "grocery_lists",
    });
    expect(auditRows).toEqual([
      expect.objectContaining({
        actor_member_id: null,
        event_type: "grocery_list.retention_deleted",
        family_id: "family-1",
        target_id: "list-1",
      }),
    ]);
  });
});

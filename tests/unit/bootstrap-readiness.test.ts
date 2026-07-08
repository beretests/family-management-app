import { describe, expect, it } from "vitest";
import { getBootstrapReadinessItems } from "@/lib/bootstrap-readiness";

describe("getBootstrapReadinessItems", () => {
  it("documents the Phase 1 platform foundation", () => {
    const items = getBootstrapReadinessItems();

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.label)).toEqual([
      "App Router",
      "Supabase Auth",
      "Free-tier guardrails",
    ]);
  });

  it("keeps paid-service work out of the bootstrap phase", () => {
    const guardrail = getBootstrapReadinessItems().find(
      (item) => item.label === "Free-tier guardrails",
    );

    expect(guardrail?.description).toContain("avoids paid services");
    expect(guardrail?.status).toBe("Protected");
  });
});

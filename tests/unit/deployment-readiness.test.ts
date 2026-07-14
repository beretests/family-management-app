import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("deployment readiness docs", () => {
  it("uses current Supabase key names in the environment example", () => {
    const envExample = read(".env.example");

    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=");
    expect(envExample).toContain("SUPABASE_SECRET_KEY=");
    expect(envExample).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });

  it("includes the production deployment checklist", () => {
    const checklist = read("docs/deployment-checklist.md");

    expect(checklist).toContain("Supabase Project");
    expect(checklist).toContain("Vercel Project");
    expect(checklist).toContain("Production Smoke Test");
  });
});

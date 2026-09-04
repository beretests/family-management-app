import { defineConfig, devices } from "@playwright/test";
import { getSupabaseLocalEnv } from "./tests/e2e/supabase-local";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3106";
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chrome";
const serverPort = new URL(baseURL).port || "3106";
const localSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
let localSupabase: ReturnType<typeof getSupabaseLocalEnv> | undefined;

try {
  localSupabase = getSupabaseLocalEnv();
} catch {
  localSupabase = undefined;
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    channel: browserChannel,
    timezoneId: "America/Regina",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `${JSON.stringify(process.execPath)} node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${serverPort}`,
    env: {
      ...process.env,
      E2E_TEST_AUTH_ENABLED: "true",
      ENABLE_FULL_APP: process.env.ENABLE_FULL_APP ?? "true",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
      NEXT_PUBLIC_ENABLE_PHONE_AUTH:
        process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH ?? "false",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        localSupabaseAnonKey,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        localSupabase?.apiUrl ??
        "http://127.0.0.1:55421",
      SUPABASE_SECRET_KEY:
        process.env.SUPABASE_SECRET_KEY ?? localSupabase?.adminKey ?? "",
    },
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
    timeout: 120_000,
    url: baseURL,
  },
});

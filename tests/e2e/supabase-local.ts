import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

type SupabaseLocalEnv = {
  apiUrl: string;
  serviceRoleKey: string;
};

export async function createConfirmedParentUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { apiUrl, serviceRoleKey } = getSupabaseLocalEnv();
  const supabase = createClient(apiUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error) {
    throw new Error(`Could not create local E2E auth user: ${error.message}`);
  }
}

function getSupabaseLocalEnv(): SupabaseLocalEnv {
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (apiUrl && serviceRoleKey) {
    return { apiUrl, serviceRoleKey };
  }

  return parseSupabaseStatusEnv();
}

function parseSupabaseStatusEnv(): SupabaseLocalEnv {
  let output = "";

  try {
    output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "E2E tests need local Supabase running, or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.",
    );
  }

  const values = new Map<string, string>();

  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)="(.+)"$/);

    if (match) {
      values.set(match[1], match[2]);
    }
  }

  const apiUrl = values.get("API_URL");
  const serviceRoleKey = values.get("SERVICE_ROLE_KEY");

  if (!apiUrl || !serviceRoleKey) {
    throw new Error("Could not read local Supabase API URL and service role key.");
  }

  return { apiUrl, serviceRoleKey };
}

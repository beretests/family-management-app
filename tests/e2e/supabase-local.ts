import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

type SupabaseLocalEnv = {
  apiUrl: string;
  adminKey: string;
};

export async function createConfirmedParentUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { adminKey, apiUrl } = getSupabaseLocalEnv();
  const supabase = createClient(apiUrl, adminKey, {
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
  const adminKey = process.env.SUPABASE_SECRET_KEY;

  if (apiUrl && adminKey) {
    return { adminKey, apiUrl };
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
      "E2E tests need local Supabase running, or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set.",
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
  const adminKey = values.get("SERVICE_ROLE_KEY");

  if (!apiUrl || !adminKey) {
    throw new Error("Could not read local Supabase API URL and admin key.");
  }

  return { adminKey, apiUrl };
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getRequiredSupabasePublicConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const { url } = getRequiredSupabasePublicConfig();
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for server maintenance.",
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getRequiredSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Creates a stateless server-side client for sending Auth magic links.
 * It deliberately has no cookie storage and must never create missing users.
 */
export function createAuthEmailClient() {
  const { publishableKey, url } = getRequiredSupabasePublicConfig();

  return createSupabaseClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "implicit",
      persistSession: false,
    },
  });
}

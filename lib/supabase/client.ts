"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabasePublicConfig } from "@/lib/supabase/config";

export function createClient() {
  const { url, publishableKey } = getRequiredSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}

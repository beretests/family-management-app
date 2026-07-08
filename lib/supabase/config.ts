export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  return {
    url,
    publishableKey,
    isConfigured: Boolean(url && publishableKey),
  };
}

export function isPhoneAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === "true";
}

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

export function getRequiredSupabasePublicConfig(): Omit<
  SupabasePublicConfig,
  "isConfigured"
> {
  const config = getSupabasePublicConfig();

  if (!config.isConfigured) {
    throw new SupabaseConfigurationError();
  }

  return {
    url: config.url,
    publishableKey: config.publishableKey,
  };
}

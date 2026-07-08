const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";

export function normalizeRedirectPath(
  value: FormDataEntryValue | string | null | undefined,
): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return value;
}

export function getAuthCallbackUrl(path = "/callback"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, appUrl).toString();
}

export function buildAuthRedirect(
  pathname: string,
  params: Record<string, string | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

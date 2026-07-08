import { type NextRequest, NextResponse } from "next/server";
import { buildAuthRedirect, normalizeRedirectPath } from "@/lib/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeRedirectPath(requestUrl.searchParams.get("next"));
  const providerError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (providerError) {
    return redirectTo(
      request,
      buildAuthRedirect("/sign-in", {
        error: providerError,
        next,
      }),
    );
  }

  if (!getSupabasePublicConfig().isConfigured) {
    return redirectTo(
      request,
      buildAuthRedirect("/sign-in", {
        error: "Supabase auth is not configured yet.",
        next,
      }),
    );
  }

  if (!code) {
    return redirectTo(
      request,
      buildAuthRedirect("/sign-in", {
        error: "The auth callback was missing a code.",
        next,
      }),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(
      request,
      buildAuthRedirect("/sign-in", {
        error: error.message,
        next,
      }),
    );
  }

  return redirectTo(request, next);
}

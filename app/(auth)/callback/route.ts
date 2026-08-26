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
  const errorPath =
    next === "/reset-password" ? "/forgot-password" : "/sign-in";
  const redirectParams = (error: string) => ({
    error,
    next: errorPath === "/sign-in" ? next : undefined,
  });
  const providerError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (providerError) {
    return redirectTo(
      request,
      buildAuthRedirect(errorPath, redirectParams(providerError)),
    );
  }

  if (!getSupabasePublicConfig().isConfigured) {
    return redirectTo(
      request,
      buildAuthRedirect(
        errorPath,
        redirectParams("Supabase auth is not configured yet."),
      ),
    );
  }

  if (!code) {
    return redirectTo(
      request,
      buildAuthRedirect(
        errorPath,
        redirectParams("The auth callback was missing a code."),
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(
      request,
      buildAuthRedirect(errorPath, redirectParams(error.message)),
    );
  }

  return redirectTo(request, next);
}

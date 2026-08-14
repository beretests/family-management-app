import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { routeRequiresFullApp } from "@/lib/feature-access";
import { isFullAppEnabled } from "@/lib/feature-flags";

export async function proxy(request: NextRequest) {
  if (!isFullAppEnabled() && routeRequiresFullApp(request.nextUrl.pathname)) {
    const calendarUrl = request.nextUrl.clone();
    calendarUrl.pathname = "/schedule";
    calendarUrl.search = "";

    return NextResponse.redirect(calendarUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

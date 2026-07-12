import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSupabasePublicConfig } from "@/lib/supabase/config";

const testSessionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  if (process.env.E2E_TEST_AUTH_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const parsed = testSessionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid test session." }, { status: 400 });
  }

  const { publishableKey, url } = getRequiredSupabasePublicConfig();
  const cookieStore = await cookies();
  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return NextResponse.json({ error: "Invalid test session." }, { status: 401 });
  }

  return response;
}

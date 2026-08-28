import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/(auth)/callback/route";

describe("auth callback errors", () => {
  it("bridges token-fragment child invites through the client callback", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

    const response = await GET(
      new NextRequest(
        "https://family.example/callback?next=%2Ffamily%2Fchild-invite%2Faccept%3Finvite%3D77777777-7777-4777-8777-777777777777",
      ),
    );

    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
    }

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://family.example/invite-callback?next=%2Ffamily%2Fchild-invite%2Faccept%3Finvite%3D77777777-7777-4777-8777-777777777777",
    );
  });

  it("returns failed password recovery callbacks to the reset request page", async () => {
    const response = await GET(
      new NextRequest(
        "https://family.example/callback?next=%2Freset-password&error_description=Recovery+link+expired",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://family.example/forgot-password?error=Recovery+link+expired",
    );
  });

  it("keeps other callback errors on the sign-in path", async () => {
    const response = await GET(
      new NextRequest(
        "https://family.example/callback?next=%2Fschedule&error_description=Access+denied",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://family.example/sign-in?error=Access+denied&next=%2Fschedule",
    );
  });
});

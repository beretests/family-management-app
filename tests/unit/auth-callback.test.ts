import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/(auth)/callback/route";

describe("auth callback errors", () => {
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

import { NextResponse } from "next/server";

export function requireCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "Cron secret is not configured." },
      { status: 500 },
    );
  }

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

import { NextResponse } from "next/server";
import { generateDailyReminders } from "@/features/reminders/maintenance";
import { requireCronAuthorization } from "@/lib/cron/auth";
import { cleanupExpiredEvidence } from "@/lib/storage/evidence-cleanup";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireCronAuthorization(request);

  if (authError) {
    return authError;
  }

  const supabase = createAdminClient();
  const now = new Date();
  const [reminders, evidenceCleanup] = await Promise.all([
    generateDailyReminders({ now, supabase }),
    cleanupExpiredEvidence({ now, supabase }),
  ]);

  return NextResponse.json({
    evidenceCleanup,
    ok: true,
    reminders,
  });
}

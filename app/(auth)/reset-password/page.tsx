import { ResetPasswordForm } from "@/components/auth/password-recovery-form";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const config = getSupabasePublicConfig();
  let isRecoverySessionAvailable = false;

  if (config.isConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    isRecoverySessionAvailable = !error && Boolean(data?.claims?.sub);
  }

  return (
    <ResetPasswordForm
      isRecoverySessionAvailable={isRecoverySessionAvailable}
      isSupabaseConfigured={config.isConfigured}
    />
  );
}

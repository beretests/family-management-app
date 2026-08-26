import { ForgotPasswordForm } from "@/components/auth/password-recovery-form";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <ForgotPasswordForm
      error={params.error}
      isSupabaseConfigured={getSupabasePublicConfig().isConfigured}
    />
  );
}

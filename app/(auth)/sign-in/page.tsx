import { AuthForm } from "@/components/auth/auth-form";
import { normalizeRedirectPath } from "@/lib/auth/redirects";
import {
  getSupabasePublicConfig,
  isPhoneAuthEnabled,
} from "@/lib/supabase/config";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <AuthForm
      error={params.error}
      isPhoneEnabled={isPhoneAuthEnabled()}
      isSupabaseConfigured={getSupabasePublicConfig().isConfigured}
      message={params.message}
      mode="sign-in"
      nextPath={normalizeRedirectPath(params.next)}
    />
  );
}

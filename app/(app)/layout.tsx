import { redirect } from "next/navigation";
import { AuthSetupRequired } from "@/components/auth/auth-setup-required";
import { AppShell } from "@/components/layout/app-shell";
import { buildAuthRedirect } from "@/lib/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!getSupabasePublicConfig().isConfigured) {
    return <AuthSetupRequired />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect(
      buildAuthRedirect("/sign-in", {
        next: "/dashboard",
      }),
    );
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : undefined;

  return <AppShell email={email}>{children}</AppShell>;
}

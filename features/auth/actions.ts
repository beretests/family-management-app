"use server";

import { redirect } from "next/navigation";
import { buildAuthRedirect, getAuthCallbackUrl, normalizeRedirectPath } from "@/lib/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { emailPasswordSchema } from "@/features/auth/schemas";

export type AuthActionState = {
  error?: string;
};

const configurationError =
  "Supabase auth is not configured yet. Add the public Supabase URL and publishable key to your environment.";

export async function signInWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (!getSupabasePublicConfig().isConfigured) {
    return { error: configurationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(parsed.data.next);
}

export async function signUpWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (!getSupabasePublicConfig().isConfigured) {
    return { error: configurationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(
        `/callback?next=${encodeURIComponent(parsed.data.next)}`,
      ),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect(parsed.data.next);
  }

  redirect(
    buildAuthRedirect("/sign-in", {
      message: "Check your email to confirm your account, then sign in.",
      next: parsed.data.next,
    }),
  );
}

export async function signInWithGoogle(formData: FormData) {
  const next = normalizeRedirectPath(formData.get("next"));

  if (!getSupabasePublicConfig().isConfigured) {
    redirect(
      buildAuthRedirect("/sign-in", {
        error: configurationError,
        next,
      }),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(`/callback?next=${encodeURIComponent(next)}`),
    },
  });

  if (error || !data.url) {
    redirect(
      buildAuthRedirect("/sign-in", {
        error: error?.message ?? "Could not start Google sign-in.",
        next,
      }),
    );
  }

  redirect(data.url);
}

export async function signOut() {
  if (getSupabasePublicConfig().isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthActionState } from "@/features/auth/actions";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/features/auth/actions";

type AuthMode = "sign-in" | "sign-up";

const initialState: AuthActionState = {};

export function AuthForm({
  mode,
  nextPath,
  isSupabaseConfigured,
  message,
  error,
  isPhoneEnabled,
}: {
  mode: AuthMode;
  nextPath: string;
  isSupabaseConfigured: boolean;
  message?: string;
  error?: string;
  isPhoneEnabled: boolean;
}) {
  const action = mode === "sign-in" ? signInWithEmail : signUpWithEmail;
  const [state, formAction] = useActionState(action, initialState);
  const title = mode === "sign-in" ? "Sign in" : "Create parent account";
  const description =
    mode === "sign-in"
      ? "Access your private family dashboard."
      : "Start with a parent or caregiver account. Kid profiles come in a later phase.";
  const alternateHref =
    mode === "sign-in"
      ? `/sign-up?next=${encodeURIComponent(nextPath)}`
      : `/sign-in?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
          Family Chore Hub
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <AuthNotice tone="warning">
          Supabase is not configured yet. Add the public Supabase URL and
          publishable key to enable sign-in locally.
        </AuthNotice>
      ) : null}

      {message ? <AuthNotice tone="success">{message}</AuthNotice> : null}
      {error || state.error ? (
        <AuthNotice tone="warning">{error ?? state.error}</AuthNotice>
      ) : null}

      <form action={formAction} className="mt-5 grid gap-4">
        <input name="next" type="hidden" value={nextPath} />

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <input
            autoComplete="email"
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            disabled={!isSupabaseConfigured}
            name="email"
            required
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Password
          <input
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            disabled={!isSupabaseConfigured}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>

        <SubmitButton disabled={!isSupabaseConfigured}>
          {mode === "sign-in" ? "Sign in with email" : "Create account"}
        </SubmitButton>
      </form>

      <form action={signInWithGoogle} className="mt-3">
        <input name="next" type="hidden" value={nextPath} />
        <button
          className="min-h-11 w-full rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isSupabaseConfigured}
          type="submit"
        >
          Continue with Google
        </button>
      </form>

      <div className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
        {mode === "sign-in" ? (
          <p>
            Need an account?{" "}
            <Link
              className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href={alternateHref}
            >
              Create one
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link
              className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href={alternateHref}
            >
              Sign in
            </Link>
          </p>
        )}
        <p className="mt-3">
          Phone auth is {isPhoneEnabled ? "visible for testing" : "disabled"}.
          It requires an SMS provider before use.
        </p>
      </div>
    </div>
  );
}

function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-11 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Working..." : children}
    </button>
  );
}

function AuthNotice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning";
}) {
  const className =
    tone === "success"
      ? "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      : "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]";

  return (
    <div className={`mt-4 rounded-md border p-3 text-sm ${className}`}>
      {children}
    </div>
  );
}

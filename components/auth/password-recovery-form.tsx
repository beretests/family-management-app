"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  AuthNotice,
  AuthSubmitButton,
} from "@/components/auth/auth-form-controls";
import type { AuthActionState } from "@/features/auth/actions";
import { requestPasswordReset, updatePassword } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export function ForgotPasswordForm({
  error,
  isSupabaseConfigured,
}: {
  error?: string;
  isSupabaseConfigured: boolean;
}) {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <AuthPanel
      description="Enter the email you use for Family Chore Hub. We’ll send a secure link if an account exists."
      title="Reset your password"
    >
      {!isSupabaseConfigured ? (
        <AuthNotice tone="warning">
          Supabase is not configured yet. Add the public Supabase URL and
          publishable key to request a password reset locally.
        </AuthNotice>
      ) : null}

      {state.message ? (
        <AuthNotice tone="success">{state.message}</AuthNotice>
      ) : null}
      {error || state.error ? (
        <AuthNotice tone="warning">{error ?? state.error}</AuthNotice>
      ) : null}

      <form action={formAction} className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          Email
          <input
            autoComplete="email"
            autoFocus
            className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            disabled={!isSupabaseConfigured}
            name="email"
            required
            type="email"
          />
        </label>

        <AuthSubmitButton
          disabled={!isSupabaseConfigured}
          pendingLabel="Sending reset link..."
        >
          Send reset link
        </AuthSubmitButton>
      </form>

      <AuthFooter>
        Remembered your password? <AuthLink href="/sign-in">Sign in</AuthLink>
      </AuthFooter>
    </AuthPanel>
  );
}

export function ResetPasswordForm({
  isRecoverySessionAvailable,
  isSupabaseConfigured,
}: {
  isRecoverySessionAvailable: boolean;
  isSupabaseConfigured: boolean;
}) {
  const [state, formAction] = useActionState(updatePassword, initialState);
  const canResetPassword = isSupabaseConfigured && isRecoverySessionAvailable;

  return (
    <AuthPanel
      description="Choose a new password for your account. You’ll sign in again after it is updated."
      title="Choose a new password"
    >
      {!isSupabaseConfigured ? (
        <AuthNotice tone="warning">
          Supabase is not configured yet. Add the public Supabase URL and
          publishable key to update a password locally.
        </AuthNotice>
      ) : null}

      {isSupabaseConfigured && !isRecoverySessionAvailable ? (
        <AuthNotice tone="warning">
          This password reset link is invalid or expired. Request a new link to
          continue.
        </AuthNotice>
      ) : null}

      {state.error ? (
        <AuthNotice tone="warning">{state.error}</AuthNotice>
      ) : null}

      {canResetPassword ? (
        <form action={formAction} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            New password
            <input
              autoComplete="new-password"
              autoFocus
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Confirm new password
            <input
              autoComplete="new-password"
              className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
          </label>

          <AuthSubmitButton
            disabled={false}
            pendingLabel="Updating password..."
          >
            Update password
          </AuthSubmitButton>
        </form>
      ) : null}

      <AuthFooter>
        {isRecoverySessionAvailable ? (
          <AuthLink href="/sign-in">Back to sign in</AuthLink>
        ) : (
          <AuthLink href="/forgot-password">Request a new reset link</AuthLink>
        )}
      </AuthFooter>
    </AuthPanel>
  );
}

function AuthPanel({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
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
      {children}
    </div>
  );
}

function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
      {children}
    </p>
  );
}

function AuthLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
      href={href}
    >
      {children}
    </Link>
  );
}

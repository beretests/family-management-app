"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function safeInvitationPath(value: string | null) {
  if (
    value?.startsWith("/family/invite/accept?invite=") ||
    value?.startsWith("/family/child-invite/accept?invite=")
  ) {
    return value;
  }

  return null;
}

export default function InviteCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function establishInviteSession() {
      const searchParams = new URLSearchParams(window.location.search);
      const next = safeInvitationPath(searchParams.get("next"));
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );

      if (!next || !accessToken || !refreshToken) {
        if (active) {
          setError("This invitation link is invalid or has expired.");
        }
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        if (active) {
          setError(sessionError.message);
        }
        return;
      }

      window.location.replace(next);
    }

    void establishInviteSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
        Family invitation
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        {error ? "Invitation could not be opened" : "Opening invitation"}
      </h1>
      <p
        className={`mt-3 text-sm leading-6 ${
          error ? "text-[var(--warning)]" : "text-[var(--muted)]"
        }`}
        role={error ? "alert" : "status"}
      >
        {error || "Verifying the secure email link…"}
      </p>
      {error ? (
        <a
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)]"
          href="/sign-in"
        >
          Return to sign in
        </a>
      ) : null}
    </div>
  );
}

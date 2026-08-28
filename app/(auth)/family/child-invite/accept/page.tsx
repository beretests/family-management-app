import Link from "next/link";
import { AcceptChildEmailInvitationForm } from "@/components/family/child-email-invitation-form";
import { createClient } from "@/lib/supabase/server";

type AcceptChildInvitePageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AcceptChildInvitePage({
  searchParams,
}: AcceptChildInvitePageProps) {
  const params = await searchParams;
  const invitationId = params.invite ?? "";
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const nextPath = `/family/child-invite/accept?invite=${encodeURIComponent(
    invitationId,
  )}`;

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
        Child account invitation
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        Connect to your family
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Open the invitation using the exact email address your parent invited,
        then create a password for your own account.
      </p>

      {!invitationId ? (
        <p className="mt-5 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          This invite link is missing an invitation id.
        </p>
      ) : data.user ? (
        <AcceptChildEmailInvitationForm invitationId={invitationId} />
      ) : (
        <div className="mt-5 grid gap-3">
          <p className="text-sm text-[var(--muted)]">
            Your email link may have expired or opened in a different browser.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={`/sign-in?next=${encodeURIComponent(nextPath)}`}
          >
            Sign in with invited email
          </Link>
        </div>
      )}
    </div>
  );
}

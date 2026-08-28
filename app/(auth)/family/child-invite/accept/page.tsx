import Link from "next/link";
import { AcceptChildEmailInvitationForm } from "@/components/family/child-email-invitation-form";
import { getChildEmailInvitationAcceptanceView } from "@/features/family/queries";

type AcceptChildInvitePageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AcceptChildInvitePage({
  searchParams,
}: AcceptChildInvitePageProps) {
  const params = await searchParams;
  const invitationId = params.invite ?? "";
  const acceptance = invitationId
    ? await getChildEmailInvitationAcceptanceView(invitationId)
    : { isAuthenticated: false };
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
        Open the secure link using the exact email address your parent invited.
        New accounts create a password; existing accounts keep their current
        password and sign-in methods.
      </p>

      {!invitationId ? (
        <p className="mt-5 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          This invite link is missing an invitation id.
        </p>
      ) : acceptance.error ? (
        <p
          className="mt-5 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]"
          role="alert"
        >
          {acceptance.error}
        </p>
      ) : acceptance.isAuthenticated && acceptance.accountMode ? (
        <AcceptChildEmailInvitationForm
          invitationId={invitationId}
          requiresPassword={acceptance.accountMode === "new_account"}
        />
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

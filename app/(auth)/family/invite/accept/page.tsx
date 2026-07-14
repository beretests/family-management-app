import Link from "next/link";
import { AcceptFamilyInvitationForm } from "@/components/family/family-invitation-form";
import { createClient } from "@/lib/supabase/server";

type AcceptFamilyInvitePageProps = {
  searchParams: Promise<{
    invite?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AcceptFamilyInvitePage({
  searchParams,
}: AcceptFamilyInvitePageProps) {
  const params = await searchParams;
  const invitationId = params.invite ?? "";
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const nextPath = `/family/invite/accept?invite=${encodeURIComponent(
    invitationId,
  )}`;

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
        Family invitation
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        Join a family
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Sign in with the invited email address, then accept the invite to link
        your account to this family.
      </p>

      {!invitationId ? (
        <p className="mt-5 rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          This invite link is missing an invitation id.
        </p>
      ) : data.user ? (
        <AcceptFamilyInvitationForm invitationId={invitationId} />
      ) : (
        <div className="mt-5 grid gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            href={`/sign-in?next=${encodeURIComponent(nextPath)}`}
          >
            Sign in to accept
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            href={`/sign-up?next=${encodeURIComponent(nextPath)}`}
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}

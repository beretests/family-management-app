import type { FamilyMember } from "@/features/family/types";
import { AppHeader } from "@/components/layout/app-header";
import { isFullAppEnabled } from "@/lib/feature-flags";

export function AppShell({
  children,
  currentMember,
  email,
  isKidMode = false,
}: {
  children: React.ReactNode;
  currentMember?: FamilyMember | null;
  email?: string;
  isKidMode?: boolean;
}) {
  const isLinkedChild = currentMember?.role === "child" && !isKidMode;
  const fullAppEnabled = isFullAppEnabled();

  return (
    <main className="min-h-screen min-w-0 overflow-x-clip">
      <AppHeader
        currentMemberName={currentMember?.displayName}
        email={email}
        fullAppEnabled={fullAppEnabled}
        isKidMode={isKidMode}
        isLinkedChild={isLinkedChild}
        isParent={currentMember?.role === "parent"}
      />
      <div className="mx-auto min-w-0 w-full max-w-6xl px-3 py-4 min-[360px]:px-4 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

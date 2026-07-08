import type { StatusTone } from "@/components/ui/status-pill";

export type BootstrapReadinessItem = {
  label: string;
  description: string;
  status: string;
  tone: StatusTone;
};

export function getBootstrapReadinessItems(): BootstrapReadinessItem[] {
  return [
    {
      label: "App Router",
      description:
        "The root layout and home surface are ready for protected app routes in Phase 2.",
      status: "Ready",
      tone: "success",
    },
    {
      label: "Supabase Auth",
      description:
        "SSR clients, protected routes, email sign-in, and Google OAuth entry points are ready for configuration.",
      status: "Ready",
      tone: "success",
    },
    {
      label: "Free-tier guardrails",
      description:
        "The foundation avoids paid services and keeps SMS, AI, storage, and cron work out of Phase 1.",
      status: "Protected",
      tone: "warning",
    },
  ];
}

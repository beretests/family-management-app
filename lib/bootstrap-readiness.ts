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
      label: "Supabase",
      description:
        "Environment variable names are documented, but clients and auth are intentionally deferred.",
      status: "Planned",
      tone: "info",
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

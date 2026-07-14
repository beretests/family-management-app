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
        "Protected app routes are implemented for family setup, chores, schedule, rewards, reminders, and reviews.",
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
        "The app avoids paid services, keeps SMS disabled, and uses private evidence storage with daily cleanup.",
      status: "Protected",
      tone: "warning",
    },
  ];
}

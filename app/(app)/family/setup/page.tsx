import { redirect } from "next/navigation";
import { FamilySetupForm } from "@/components/family/family-setup-form";
import { getFamilyContext } from "@/features/family/queries";

export const dynamic = "force-dynamic";

export default async function FamilySetupPage() {
  const context = await getFamilyContext();

  if (context.family) {
    redirect("/settings/family");
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <FamilySetupForm />
    </section>
  );
}

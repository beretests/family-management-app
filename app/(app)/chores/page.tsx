import { redirect } from "next/navigation";
import { ChoreTemplateList } from "@/components/chores/chore-template-list";
import { CreateChoreTemplateForm } from "@/components/chores/chore-template-form";
import { GenerateChoreTemplatesForm } from "@/components/chores/generate-chore-templates-form";
import { HouseProfileForm } from "@/components/chores/house-profile-form";
import { StarterChoreLibrary } from "@/components/chores/starter-chore-library";
import { StatusPill } from "@/components/ui/status-pill";
import { getFamilyContext } from "@/features/family/queries";
import { generateChoreTemplates } from "@/features/chores/generator";
import {
  getChoreTemplates,
  getDefaultHouseProfile,
  getHouseProfile,
  getStarterChoreTemplates,
} from "@/features/chores/queries";

export const dynamic = "force-dynamic";

export default async function ChoresPage() {
  const context = await getFamilyContext();

  if (!context.family) {
    redirect("/family/setup");
  }

  if (context.currentMember?.role !== "parent") {
    redirect("/dashboard");
  }

  const [houseProfileRow, starterTemplates, choreTemplates] = await Promise.all([
    getHouseProfile(context.family.id),
    getStarterChoreTemplates(),
    getChoreTemplates(context.family.id),
  ]);
  const houseProfile =
    houseProfileRow ?? getDefaultHouseProfile(context.family.id);
  const generatedPreview = generateChoreTemplates({
    existingTitles: choreTemplates.map((template) => template.title),
    houseProfile,
    starterTemplates,
  });

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusPill tone="info">Chore templates</StatusPill>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              Build the family chore library
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Configure the house, generate starter chores, and edit templates
              before assignments begin in a later phase.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="Active" value={choreTemplates.filter((template) => template.active).length} />
            <Metric label="Starters" value={starterTemplates.length} />
          </div>
        </div>
      </div>

      <HouseProfileForm familyId={context.family.id} profile={houseProfile} />
      <GenerateChoreTemplatesForm
        familyId={context.family.id}
        previewCount={generatedPreview.length}
      />
      <ChoreTemplateList
        familyId={context.family.id}
        templates={choreTemplates}
      />
      <CreateChoreTemplateForm familyId={context.family.id} />
      <StarterChoreLibrary templates={starterTemplates} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--line)] px-3 py-2">
      <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

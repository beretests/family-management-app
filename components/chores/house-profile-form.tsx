"use client";

import { useActionState } from "react";
import { ActionMessage, SubmitButton } from "@/components/family/form-status";
import { saveHouseProfile, type ChoreActionState } from "@/features/chores/actions";
import type { HouseProfile } from "@/features/chores/types";

const initialState: ChoreActionState = {};

export function HouseProfileForm({
  familyId,
  profile,
}: {
  familyId: string;
  profile: HouseProfile;
}) {
  const [state, formAction] = useActionState(saveHouseProfile, initialState);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        House profile
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Chore generation uses these home details to pick starter templates.
      </p>

      <form action={formAction} className="mt-5 grid gap-5">
        <input name="familyId" type="hidden" value={familyId} />
        <ActionMessage error={state.error} success={state.success} />

        <div className="grid gap-4 md:grid-cols-3">
          <NumberField defaultValue={profile.kitchens} label="Kitchens" name="kitchens" />
          <NumberField
            defaultValue={profile.diningAreas}
            label="Dining areas"
            name="diningAreas"
          />
          <NumberField
            defaultValue={profile.livingRooms}
            label="Living rooms"
            name="livingRooms"
          />
          <NumberField
            defaultValue={profile.halfBathrooms}
            label="Half bathrooms"
            name="halfBathrooms"
          />
          <NumberField
            defaultValue={profile.fullBathrooms}
            label="Full bathrooms"
            name="fullBathrooms"
          />
          <NumberField defaultValue={profile.bedrooms} label="Bedrooms" name="bedrooms" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CheckboxField
            defaultChecked={profile.hasLaundryRoom}
            label="Laundry room"
            name="hasLaundryRoom"
          />
          <CheckboxField
            defaultChecked={profile.hasStairs}
            label="Stairs"
            name="hasStairs"
          />
          <CheckboxField
            defaultChecked={profile.hasEntryway}
            label="Entryway or closet"
            name="hasEntryway"
          />
          <CheckboxField defaultChecked={profile.hasYard} label="Yard" name="hasYard" />
          <CheckboxField
            defaultChecked={profile.hasGarden}
            label="Garden"
            name="hasGarden"
          />
          <CheckboxField
            defaultChecked={profile.hasGarage}
            label="Garage"
            name="hasGarage"
          />
          <CheckboxField
            defaultChecked={profile.carChoresEnabled}
            label="Car chores"
            name="carChoresEnabled"
          />
          <CheckboxField
            defaultChecked={profile.groceryChoresEnabled}
            label="Grocery errands"
            name="groceryChoresEnabled"
          />
          <CheckboxField
            defaultChecked={profile.petsPresent}
            label="Pets"
            name="petsPresent"
          />
        </div>

        <div>
          <SubmitButton>Save house profile</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function NumberField({
  defaultValue,
  label,
  name,
}: {
  defaultValue: number;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        className="min-h-11 rounded-md border border-[var(--line)] px-3 text-base outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        defaultValue={defaultValue}
        max={20}
        min={0}
        name={name}
        required
        type="number"
      />
    </label>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-[var(--foreground)]">
      <input
        className="size-4"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  );
}

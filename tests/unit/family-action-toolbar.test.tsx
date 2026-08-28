import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FamilyActionToolbar } from "@/components/family/family-action-toolbar";

const familyId = "22222222-2222-4222-8222-222222222222";

describe("FamilyActionToolbar", () => {
  it("opens add-child and adult-invite forms in accessible modals", () => {
    render(<FamilyActionToolbar familyId={familyId} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add child" }));

    const childDialog = screen.getByRole("dialog", { name: "Add a child" });
    expect(within(childDialog).getByLabelText("Name")).toBeVisible();
    expect(
      within(childDialog).getByRole("button", { name: "Add child" }),
    ).toBeVisible();

    fireEvent.click(
      within(childDialog).getByRole("button", { name: "Close add child" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Invite adult" }));
    const adultDialog = screen.getByRole("dialog", {
      name: "Invite a parent or caregiver",
    });
    expect(within(adultDialog).getByLabelText("Display name")).toBeVisible();
    expect(within(adultDialog).getByLabelText("Email")).toBeVisible();
    expect(within(adultDialog).getByLabelText("Role")).toBeVisible();
  });
});

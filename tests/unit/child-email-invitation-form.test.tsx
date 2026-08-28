import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AcceptChildEmailInvitationForm } from "@/components/family/child-email-invitation-form";

const invitationId = "66666666-6666-4666-8666-666666666666";

afterEach(cleanup);

describe("AcceptChildEmailInvitationForm", () => {
  it("asks new child accounts to create a password", () => {
    render(
      <AcceptChildEmailInvitationForm
        invitationId={invitationId}
        requiresPassword
      />,
    );

    expect(screen.getByLabelText("Create password")).toBeRequired();
    expect(screen.getByLabelText("Confirm password")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Connect to family" }),
    ).toBeVisible();
  });

  it("preserves credentials for an existing child account", () => {
    render(
      <AcceptChildEmailInvitationForm
        invitationId={invitationId}
        requiresPassword={false}
      />,
    );

    expect(screen.queryByLabelText("Create password")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument();
    expect(
      screen.getByText(/current password and sign-in methods will not change/i),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Connect existing account" }),
    ).toBeVisible();
  });
});

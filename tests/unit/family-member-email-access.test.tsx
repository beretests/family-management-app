import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FamilyMemberList } from "@/components/family/family-member-list";
import type {
  ChildEmailInvitation,
  FamilyMemberWithDetails,
} from "@/features/family/types";

const familyId = "22222222-2222-4222-8222-222222222222";

function child(
  id: string,
  displayName: string,
  profileId: string | null,
): FamilyMemberWithDetails {
  return {
    id,
    familyId,
    profileId,
    displayName,
    role: "child",
    birthdate: "2015-01-01",
    ageYears: 11,
    abilityLevel: 3,
    color: "#047857",
    lifecycleStatus: "active",
    deactivatedAt: null,
    preferences: null,
    currentStatus: null,
    hasKidModePin: true,
  };
}

const parent: FamilyMemberWithDetails = {
  id: "11111111-1111-4111-8111-111111111111",
  familyId,
  profileId: "99999999-9999-4999-8999-999999999999",
  displayName: "Parent",
  role: "parent",
  birthdate: null,
  ageYears: null,
  abilityLevel: 5,
  color: "#2563eb",
  lifecycleStatus: "active",
  deactivatedAt: null,
  preferences: null,
  currentStatus: null,
  hasKidModePin: false,
};

afterEach(cleanup);

describe("FamilyMemberList child email access", () => {
  it("shows connected, pending, and available account controls distinctly", () => {
    const pendingInvitation: ChildEmailInvitation = {
      id: "77777777-7777-4777-8777-777777777777",
      familyId,
      memberId: "44444444-4444-4444-8444-444444444444",
      emailNormalized: "pending@example.com",
      accountMode: "new_account",
      status: "pending",
      invitedByMemberId: "11111111-1111-4111-8111-111111111111",
      acceptedByProfileId: null,
      createdAt: "2026-08-28T12:00:00Z",
      expiresAt: "2026-09-11T12:00:00Z",
      acceptedAt: null,
      revokedAt: null,
    };

    render(
      <FamilyMemberList
        childInvitations={[pendingInvitation]}
        currentMemberId="11111111-1111-4111-8111-111111111111"
        familyId={familyId}
        invitations={[]}
        members={[
          parent,
          child(
            "33333333-3333-4333-8333-333333333333",
            "Connected child",
            "55555555-5555-4555-8555-555555555555",
          ),
          child("44444444-4444-4444-8444-444444444444", "Pending child", null),
          child("66666666-6666-4666-8666-666666666666", "PIN only child", null),
        ]}
      />,
    );

    expect(screen.getByText("Email connected")).toBeVisible();
    expect(screen.getByText("Email invite pending")).toBeVisible();
    expect(screen.getByText("No email account")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Disconnect email" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Revoke email invite" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Generate fresh link" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Connect email" })).toBeVisible();

    const childCard = screen
      .getByRole("heading", { name: "PIN only child" })
      .closest("article");

    expect(childCard).not.toBeNull();
    fireEvent.click(
      within(childCard as HTMLElement).getByRole("button", {
        name: "Connect email",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Connect email for PIN only child" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Send connection email" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Generate secure link" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Close child email connection" }),
    );

    fireEvent.click(
      within(childCard as HTMLElement).getByRole("button", {
        name: "Edit profile",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Edit PIN only child" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Close child profile editor" }),
    );

    const parentArticle = screen
      .getByRole("heading", { name: "Parent" })
      .closest("article");
    expect(parentArticle).not.toBeNull();
    fireEvent.click(
      within(parentArticle as HTMLElement).getByRole("button", {
        name: "Edit profile",
      }),
    );
    expect(screen.getByRole("dialog", { name: "Edit Parent" })).toBeVisible();
  });
});

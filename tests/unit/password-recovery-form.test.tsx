import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/components/auth/password-recovery-form";

afterEach(cleanup);

describe("password recovery forms", () => {
  it("renders an accessible reset request form", () => {
    render(<ForgotPasswordForm isSupabaseConfigured />);

    expect(
      screen.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeEnabled();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("does not render password fields without a verified session", () => {
    render(
      <ResetPasswordForm
        isRecoverySessionAvailable={false}
        isSupabaseConfigured
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("invalid or expired");
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Request a new reset link" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("renders matching password fields for a verified session", () => {
    render(
      <ResetPasswordForm isRecoverySessionAvailable isSupabaseConfigured />,
    );

    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirm new password")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Update password" }),
    ).toBeEnabled();
  });
});

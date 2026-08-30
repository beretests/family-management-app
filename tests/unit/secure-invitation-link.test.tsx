import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SecureInvitationLink } from "@/components/family/family-member-list";

const secureLink =
  "https://example.supabase.co/auth/v1/verify?token=secret&type=invite";

afterEach(() => {
  cleanup();
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
});

describe("SecureInvitationLink", () => {
  it("copies the generated bearer link only after an explicit button press", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SecureInvitationLink link={secureLink} />);

    expect(screen.getByLabelText("Secure invitation link")).toHaveValue(
      secureLink,
    );
    expect(writeText).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(secureLink));
    expect(screen.getByRole("status")).toHaveTextContent("Link copied.");
  });

  it("keeps the link selectable when clipboard access is unavailable", async () => {
    render(<SecureInvitationLink link={secureLink} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Select and copy the highlighted link.",
      ),
    );
    expect(screen.getByLabelText("Secure invitation link")).toHaveFocus();
  });
});

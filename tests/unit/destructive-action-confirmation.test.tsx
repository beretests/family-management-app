import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestructiveActionConfirmation } from "@/components/ui/destructive-action-confirmation";

describe("DestructiveActionConfirmation", () => {
  it("allows only one submission while a destructive action is pending", async () => {
    let finishAction: (() => void) | undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishAction = resolve;
        }),
    );

    render(
      <form action={action}>
        <DestructiveActionConfirmation
          cancelLabel="Keep record"
          confirmLabel="Delete permanently"
          description="This cannot be undone."
          pendingLabel="Deleting record..."
          title="Delete this record?"
          triggerLabel="Delete record"
        />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete record" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Deleting record..." }),
      ).toBeDisabled(),
    );
    expect(screen.getByRole("button", { name: "Keep record" })).toBeDisabled();
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishAction?.();
    });
  });
});

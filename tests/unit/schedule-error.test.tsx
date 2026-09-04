import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScheduleError from "@/app/(app)/schedule/error";

describe("ScheduleError", () => {
  it("explains that a failed refresh can be retried safely", () => {
    const reset = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<ScheduleError error={new Error("refresh failed")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "The calendar could not refresh" }),
    ).toBeVisible();
    expect(screen.getByText(/last change may already be saved/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry calendar" }));
    expect(reset).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

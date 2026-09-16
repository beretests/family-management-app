import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateScheduleEventForm } from "@/components/schedule/schedule-event-form";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/features/schedule/actions", () => ({
  createScheduleEvent: mocks.create,
  updateScheduleEvent: vi.fn(),
  deleteScheduleEvent: vi.fn(),
}));
function renderForm() {
  render(
    <CreateScheduleEventForm
      actorMemberId="33333333-3333-4333-8333-333333333333"
      canManageAll
      familyId="22222222-2222-4222-8222-222222222222"
      members={[]}
      timeZone="America/Regina"
      defaultStartsAt="2026-09-16T15:00:00Z"
      defaultEndsAt="2026-09-16T16:00:00Z"
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Soccer" },
  });
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ error: "Retry save" });
});

describe("schedule date entry", () => {
  it("preserves an invalid end time and blocks save instead of adding an hour", () => {
    renderForm();
    change("Ends", "2026-09-16T08:00");
    expect(screen.getByLabelText("Ends")).toHaveValue("2026-09-16T08:00");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "End time must be after start time.",
    );
    expect(screen.getByRole("button", { name: "Add event" })).toBeDisabled();
    const form = screen.getByLabelText("Starts").closest("form")!;
    expect(fireEvent.submit(form)).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("submits exact text dates after other fields change and preserves them when toggling entry modes", async () => {
    renderForm();
    fireEvent.click(screen.getByLabelText("Enter dates and times as text"));
    change("Starts", "2026-09-22T16:30");
    change("Ends", "2026-09-22T17:45");
    change("Repeats", "weekly");
    change("Series ends", "on");
    change("End date", "2026-12-22");
    change("Location", "Field 2");
    fireEvent.click(screen.getByLabelText("Enter dates and times as text"));
    expect(screen.getByLabelText("Starts")).toHaveValue("2026-09-22T16:30");
    expect(screen.getByLabelText("Ends")).toHaveValue("2026-09-22T17:45");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Starts 2026-09-22 at 16:30 · Ends 2026-09-22 at 17:45 (America/Regina)",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    const data = mocks.create.mock.calls[0][1] as FormData;
    expect(data.get("startsAt")).toBe("2026-09-22T16:30");
    expect(data.get("endsAt")).toBe("2026-09-22T17:45");
    expect(data.get("timeZone")).toBe("America/Regina");
    expect(data.get("recurrenceEndsOn")).toBe("2026-12-22");
  });

  it("rejects impossible text dates and does not overwrite raw entry", () => {
    renderForm();
    fireEvent.click(screen.getByLabelText("Enter dates and times as text"));
    change("Starts", "2026-02-30T16:30");
    expect(screen.getByLabelText("Starts")).toHaveValue("2026-02-30T16:30");
    expect(screen.getByLabelText("Starts")).toBeInvalid();
    expect(screen.getByRole("button", { name: "Add event" })).toBeDisabled();
  });

  it("validates all-day text dates without crashing or silently adjusting the last day", () => {
    renderForm();
    fireEvent.click(screen.getByLabelText("All day"));
    fireEvent.click(screen.getByLabelText("Enter dates and times as text"));
    change("Last day", "2026-02-30");
    expect(screen.getByLabelText("Last day")).toBeInvalid();
    change("First day", "2026-10-01");
    change("Last day", "2026-09-30");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Last day must be on or after first day.",
    );
    expect(screen.getByRole("button", { name: "Add event" })).toBeDisabled();
    change("Last day", "2026-10-01");
    const form = screen.getByLabelText("First day").closest("form")!;
    expect(new FormData(form).get("endsAt")).toBe("2026-10-02T00:00");
  });
});
